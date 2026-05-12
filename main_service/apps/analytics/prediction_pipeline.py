from __future__ import annotations

import json
from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from django.db import transaction
from django.utils import timezone

from apps.analytics.gemini_client import generate_structured_recommendation
from apps.analytics.models import Diagnosis, PredictionResult, Recommendation, Session
from apps.analytics.s1_s7 import calculate_s1_s7
from apps.tenants.models import Tenant


def _parse_datetime(value: str | None) -> datetime:
    if not value:
        return timezone.now()
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _resolve_tenant(tenant_id: Any = None, organization_id: Any = None) -> Tenant:
    raw = organization_id or tenant_id
    if raw is None:
        raise Tenant.DoesNotExist("prediction payload did not include tenant_id")

    try:
        return Tenant.objects.get(id=int(raw))
    except (TypeError, ValueError, Tenant.DoesNotExist):
        pass

    try:
        external_id = UUID(str(raw))
        return Tenant.objects.get(external_id=external_id)
    except (ValueError, Tenant.DoesNotExist):
        raise Tenant.DoesNotExist(f"tenant not found for id={raw!r}")


def _top_features_to_shap(top_features: list[dict] | None, shap_values: dict | None) -> dict[str, float]:
    if shap_values:
        return {str(k): float(v) for k, v in shap_values.items()}
    result: dict[str, float] = {}
    for item in top_features or []:
        feature = item.get("feature")
        if not feature:
            continue
        result[str(feature)] = float(item.get("importance") or 0.0)
    return result


def _decimal(value: float) -> Decimal:
    return Decimal(str(round(float(value), 4)))


def _recommendation_text(scoring: dict[str, Any], probability: float, predicted_class: str) -> str:
    # Gemini ажиллахгүй үед deterministic fallback JSON буцаана.
    # Ингэснээр recommendation contract тасрахгүй, dashboard хоосон/эвдэрсэн payload авахгүй.
    payload = generate_structured_recommendation(
        dominant_reason=scoring["dominant_reason"],
        reason_label=scoring["reason_label"],
        scores={f"S{i}": float(scoring[f"S{i}"]) for i in range(1, 8)},
        probability=probability,
    )
    payload.setdefault("summary", f"Predicted class is {predicted_class} with abandonment probability {probability:.2f}.")
    return json.dumps(payload, ensure_ascii=False)


def _truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes"}
    return bool(value)


def _extract_raw_event_types(payload: dict[str, Any]) -> set[str]:
    event_types: set[str] = set()
    for event in payload.get("raw_events") or payload.get("events") or []:
        if isinstance(event, dict):
            raw = event.get("event_type") or event.get("type")
            if raw:
                event_types.add(str(raw).lower())
    for event in payload.get("event_sequence") or []:
        if isinstance(event, str):
            event_types.add(event.lower())
        elif isinstance(event, dict):
            raw = event.get("event_type") or event.get("type")
            if raw:
                event_types.add(str(raw).lower())
    final_event_type = payload.get("final_event_type")
    if final_event_type:
        event_types.add(str(final_event_type).lower())
    return event_types


def should_create_abandonment_diagnosis(
    payload: dict[str, Any],
    raw_events: list[dict[str, Any]] | None = None,
) -> tuple[bool, str]:
    """
    Худалдан авалт амжилттай дууссан сесс дээр abandoned оношлогоо үүсгэхээс хамгаална.

    Бизнесийн дүрэм:
    - purchase_success/order_success үйлдэл байгаа бол session_id доторх бизнесийн үр дүн converted.
    - CONVERTED төлөв нь terminal төлөв тул ML abandoned гэж таамагласан ч diagnosis/recommendation үүсгэхгүй.
    - Override reason-г хадгалж dashboard дээр ML conflict-ийг ил тод тайлбарлах боломжтой байлгана.
    """

    session_state = str(payload.get("session_state") or "").upper()
    has_purchase_success = _truthy(payload.get("has_purchase_success"))
    event_payload = dict(payload)
    if raw_events:
        event_payload["raw_events"] = raw_events
    raw_event_types = _extract_raw_event_types(event_payload)

    if session_state == "CONVERTED":
        return False, "session_state is CONVERTED"
    if has_purchase_success:
        return False, "payload has_purchase_success is true"
    if {"purchase_success", "order_success"} & raw_event_types:
        return False, "purchase_success/order_success exists in raw events"

    predicted_class = str(payload.get("predicted_class") or "").lower()
    if predicted_class and predicted_class not in {"abandoned", "abandon"}:
        return False, f"predicted_class is {predicted_class}"

    return True, ""


def _business_session_state(payload: dict[str, Any]) -> str:
    # Prediction payload дахь бизнес metadata нь ML score-оос өндөр эрхтэй.
    # UC2 дээр purchase_success байгаа тул predicted_class=abandoned байсан ч session_state=CONVERTED хэвээр үлдэнэ.
    if _truthy(payload.get("has_purchase_success")):
        return "CONVERTED"
    event_types = _extract_raw_event_types(payload)
    if {"purchase_success", "order_success"} & event_types:
        return "CONVERTED"
    if {"abandon_checkout", "session_end", "beforeunload"} & event_types:
        return "ABANDONED"
    state = str(payload.get("session_state") or "UNKNOWN").upper()
    return state or "UNKNOWN"


def handle_prediction_payload(payload: dict[str, Any]) -> dict[str, Any]:
    """
    prediction_done payload-г idempotent байдлаар хадгалж, abandoned сесс дээр S1-S7 оношлогоо үүсгэнэ.

    Contract:
    - Session, PredictionResult, Diagnosis, Recommendation нь session_id + tenant дээр update_or_create ашиглана.
    - Давтан Kafka delivery ирсэн ч duplicate diagnosis/recommendation үүсэхгүй.
    - Converted сесс дээр өмнөх abandoned diagnosis байвал устгаж бизнесийн үнэн төлөвийг хамгаална.
    """

    session_id = str(payload["session_id"])
    tenant = _resolve_tenant(payload.get("tenant_id"), payload.get("organization_id"))
    visitor_id = str(payload.get("visitor_id") or "unknown")
    features = payload.get("features") or {}

    probability = float(
        payload.get("abandonment_probability")
        if payload.get("abandonment_probability") is not None
        else payload.get("prediction_score", 0.0)
    )
    predicted_class = str(payload.get("predicted_class") or ("abandoned" if probability >= 0.5 else "converted"))
    predicted_label = int(
        payload.get("predicted_label")
        if payload.get("predicted_label") is not None
        else (1 if predicted_class == "abandoned" else 0)
    )
    model_version = str(payload.get("model_version") or "")
    model_name = str(payload.get("model_name") or "xgboost")
    model_variant = str(payload.get("model_variant") or model_name)
    created_at = _parse_datetime(payload.get("created_at") or payload.get("predicted_at"))
    top_features = payload.get("top_features") or []
    shap_values = _top_features_to_shap(top_features, payload.get("shap_values") or {})
    session_state = _business_session_state(payload)
    has_purchase_success = _truthy(payload.get("has_purchase_success"))
    has_checkout_start = _truthy(payload.get("has_checkout_start"))
    has_cart_activity = _truthy(payload.get("has_cart_activity"))
    final_event_type = str(payload.get("final_event_type") or "")
    event_sequence = payload.get("event_sequence") or []

    should_diagnose, override_reason = should_create_abandonment_diagnosis(payload)
    business_outcome = "abandoned" if should_diagnose else "converted"
    prediction_overridden = bool(override_reason and predicted_class.lower() in {"abandoned", "abandon"})

    scoring: dict[str, Any] | None = None
    recommendation_text = ""
    if should_diagnose:
        # dominant_reason = argmax(S1..S7). Энэ calculation нь thesis S1-S7 canonical scorer дээр төвлөрсөн.
        scoring = calculate_s1_s7(features)
        recommendation_text = _recommendation_text(scoring, probability, predicted_class)

    with transaction.atomic():
        session, _ = Session.objects.update_or_create(
            session_id=session_id,
            defaults={
                "visitor_id": visitor_id,
                "tenant": tenant,
                "started_at": created_at,
                "ended_at": created_at,
                "event_count": int(features.get("event_count") or 0),
                "page_views": int(features.get("page_view_count") or features.get("page_views") or 0),
                "device_type": str(features.get("device_type") or ("mobile" if features.get("is_mobile") else "desktop")),
                "session_state": session_state,
                "has_purchase_success": has_purchase_success,
                "has_checkout_start": has_checkout_start,
                "has_cart_activity": has_cart_activity,
                "final_event_type": final_event_type,
                "event_sequence": event_sequence if isinstance(event_sequence, list) else [],
            },
        )

        PredictionResult.objects.update_or_create(
            session=session,
            tenant=tenant,
            defaults={
                "prediction_score": probability,
                "predicted_class": predicted_class,
                "shap_values": shap_values,
                "model_variant": model_variant,
                "abandonment_probability": probability,
                "confidence": max(probability, 1.0 - probability),
                "model_version": model_version,
                "predicted_at": created_at,
                "business_outcome": business_outcome,
                "prediction_overridden": prediction_overridden,
                "override_reason": override_reason,
                "outcome_metadata": {
                    "session_state": session_state,
                    "has_purchase_success": has_purchase_success,
                    "has_checkout_start": has_checkout_start,
                    "has_cart_activity": has_cart_activity,
                    "final_event_type": final_event_type,
                },
            },
        )

        if not should_diagnose:
            # Converted сесс дээр abandoned оношлогоо үлдэхээс хамгаалж хуучин diagnosis-г цэвэрлэнэ.
            # PredictionResult-г үлдээдэг нь ML conflict override-г dashboard дээр шалгах evidence болдог.
            Diagnosis.objects.filter(tenant=tenant, session_id=session_id).delete()
            return {
                "status": "ok",
                "session_id": session_id,
                "tenant_id": tenant.id,
                "diagnosis_id": None,
                "business_outcome": business_outcome,
                "prediction_overridden": prediction_overridden,
                "override_reason": override_reason,
            }

        assert scoring is not None
        diagnosis, _ = Diagnosis.objects.update_or_create(
            tenant=tenant,
            session_id=session_id,
            defaults={
                "visitor_id": visitor_id,
                "tier": tenant.tier,
                "score_s1": _decimal(scoring["S1"]),
                "score_s2": _decimal(scoring["S2"]),
                "score_s3": _decimal(scoring["S3"]),
                "score_s4": _decimal(scoring["S4"]),
                "score_s5": _decimal(scoring["S5"]),
                "score_s6": _decimal(scoring["S6"]),
                "score_s7": _decimal(scoring["S7"]),
                "abandonment_probability": probability,
                "predicted_label": predicted_label,
                "predicted_class": predicted_class,
                "model_version": model_version,
                "dominant_reason": scoring["dominant_reason"],
                "reason_label": scoring["reason_label"],
                "explanation": scoring["explanation"],
                "top_features": top_features,
                "status": Diagnosis.Status.CREATED,
            },
        )

        Recommendation.objects.update_or_create(
            diagnosis=diagnosis,
            tenant=tenant,
            defaults={
                "text_mn": recommendation_text,
                "dominant_score": _decimal(scoring["dominant_score"]),
                # Recommendation status дахин ирсэн prediction_done дээр CREATED болж reset хийх одоогийн contract.
                # Хэрэглэгчийн status update flow-г тусдаа dashboard endpoint удирдана.
                "status": Recommendation.Status.CREATED,
            },
        )

    return {
        "status": "ok",
        "session_id": session_id,
        "tenant_id": tenant.id,
        "diagnosis_id": diagnosis.id,
        "dominant_reason": scoring["dominant_reason"],
        "business_outcome": business_outcome,
        "prediction_overridden": prediction_overridden,
    }
