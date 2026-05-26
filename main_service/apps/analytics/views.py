import json
import os
import socket
import time
from datetime import datetime, timedelta, timezone as datetime_timezone

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import connections
from django.db.models import Avg, Count, Q, Sum
from django.db.models.functions import Greatest
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.duckdb_client import get_duckdb_daily_trend
from apps.analytics.models import Diagnosis, PredictionResult, Recommendation, Session
from apps.analytics.observer_db import fetch_session_events
from apps.analytics.serializers import ExportTriggerSerializer, StoreSettingsSerializer
from apps.analytics.s1_s7 import REASON_INFO
from apps.analytics.tasks import export_to_minio
from apps.analytics.utils import get_tenant
from apps.tenants.models import APIKey, TeamMember, Tenant


def resolve_tenant_for_user(request):
    memberships = TeamMember.objects.select_related("tenant").filter(
        user=request.user,
        tenant__status=Tenant.Status.ACTIVE,
        role__in=[TeamMember.Role.OWNER, TeamMember.Role.ADMIN, TeamMember.Role.MEMBER],
    )
    tenant_id = request.query_params.get("tenant_id")
    if tenant_id:
        memberships = memberships.filter(tenant_id=tenant_id)
    results = list(memberships[:2])
    if len(results) == 1:
        return results[0].tenant
    return None


def _std_paginator(request):
    p = PageNumberPagination()
    p.page_size_query_param = "page_size"
    try:
        p.page_size = int(request.query_params.get("page_size", 20))
    except (TypeError, ValueError):
        p.page_size = 20
    return p


def _risk(max_score: float) -> str:
    if max_score > 0.75:
        return "high"
    if max_score > 0.5:
        return "medium"
    return "low"


# ---------------------------------------------------------------------------
# Overview
# ---------------------------------------------------------------------------

class AnalyticsOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        total_sessions = Session.objects.filter(tenant=tenant).count()
        total_predictions = PredictionResult.objects.filter(tenant=tenant).count()
        abandoned_count = _abandoned_prediction_count(PredictionResult.objects.filter(tenant=tenant))
        abandonment_rate = (abandoned_count / total_predictions) if total_predictions else 0.0
        avg_confidence = (
            PredictionResult.objects.filter(tenant=tenant).aggregate(v=Avg("confidence"))["v"] or 0.0
        )
        active_sessions = Session.objects.filter(tenant=tenant, ended_at__isnull=True).count()
        mobile_count = Session.objects.filter(tenant=tenant, device_type="mobile").count()
        mobile_rate = (mobile_count / total_sessions) if total_sessions else 0.0
        trend_7d = get_duckdb_daily_trend(tenant.id, days=7)

        # Checkout funnel dropoff — computed from session stages
        sessions_with_events = Session.objects.filter(tenant=tenant, event_count__gte=3).count()
        conversions = total_predictions - abandoned_count
        dropoff = []
        if total_sessions:
            stages = [
                ("Нүүр хуудас",   total_sessions),
                ("Бараа харах",   sessions_with_events),
                ("Сагс нэмэх",   total_predictions),
                ("Checkout",      max(0, total_predictions - abandoned_count // 2)),
                ("Төлбөр",        conversions),
            ]
            for i, (step, users) in enumerate(stages):
                prev_users = stages[i - 1][1] if i > 0 else users
                drop_pct = round((1 - users / prev_users) * 100) if prev_users and i > 0 else 0
                dropoff.append({"step": step, "users": users, "drop_percent": max(0, drop_pct)})

        # Traffic sources — device type breakdown
        desktop_count = max(0, total_sessions - mobile_count)
        tablet_count = Session.objects.filter(tenant=tenant, device_type="tablet").count()
        other_count = max(0, total_sessions - mobile_count - desktop_count)
        traffic_sources = []
        if total_sessions:
            raw = [
                ("Mobile",   mobile_count),
                ("Desktop",  max(0, desktop_count - tablet_count)),
                ("Tablet",   tablet_count),
                ("Бусад",    other_count),
            ]
            traffic_sources = [
                {"source": name, "value": round(count / total_sessions * 100, 1)}
                for name, count in raw
                if count > 0
            ]

        # Formatted KPI array (matches frontend DashboardKpi shape)
        kpis = [
            {"label": "Нийт session",     "value": total_sessions,                                              "trendPercent": 0},
            {"label": "Орхилтын хувь",    "value": f"{round(abandonment_rate * 100, 1)}%" if total_predictions else "—", "trendPercent": 0},
            {"label": "Идэвхтэй session", "value": active_sessions,                                             "trendPercent": 0},
            {"label": "Мобайл хувь",      "value": f"{round(mobile_rate * 100, 1)}%" if total_sessions else "—", "trendPercent": 0},
        ]

        return Response({
            "total_sessions": total_sessions,
            "total_predictions": total_predictions,
            "abandonment_rate": round(abandonment_rate, 4),
            "avg_confidence": round(float(avg_confidence), 4),
            "active_sessions": active_sessions,
            "mobile_rate": round(mobile_rate, 4),
            "trend_7d": trend_7d,
            "kpis": kpis,
            "dropoff": dropoff,
            "traffic_sources": traffic_sources,
        })


# ---------------------------------------------------------------------------
# Scores
# ---------------------------------------------------------------------------

_SCORE_LABELS = {
    "S1": "Engagement",
    "S2": "Checkout Progress",
    "S3": "Return Intent",
    "S4": "Price Sensitivity",
    "S5": "Cart Commitment",
    "S6": "Navigation Depth",
    "S7": "Time on Site",
}


class AnalyticsScoresView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        diagnoses = list(Diagnosis.objects.filter(tenant=tenant).order_by("-created_at")[:2])
        if not diagnoses:
            return Response({"detail": "No diagnosis yet"}, status=status.HTTP_204_NO_CONTENT)

        latest = diagnoses[0]
        prev = diagnoses[1] if len(diagnoses) > 1 else None

        def _score(d, idx):
            return float(getattr(d, f"score_s{idx}"))

        def _trend(idx):
            if prev is None:
                return "stable"
            delta = _score(latest, idx) - _score(prev, idx)
            if delta > 0.01:
                return "up"
            if delta < -0.01:
                return "down"
            return "stable"

        scores = {
            f"S{i}": {
                "score": round(_score(latest, i), 4),
                "label": _SCORE_LABELS.get(f"S{i}", f"S{i}"),
                "trend": _trend(i),
            }
            for i in range(1, 8)
        }
        return Response({"scores": scores})


# ---------------------------------------------------------------------------
# Analytics history  (paginated, filtered — replaces the old limit-based version)
# ---------------------------------------------------------------------------

class AnalyticsHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = (
            Diagnosis.objects.filter(tenant=tenant)
            .annotate(max_score=Greatest(
                "score_s1", "score_s2", "score_s3", "score_s4",
                "score_s5", "score_s6", "score_s7",
            ))
            .order_by("-created_at")
        )

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")
        risk_filter = request.query_params.get("risk")
        session_id_filter = request.query_params.get("session_id")

        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)
        if session_id_filter:
            qs = qs.filter(session_id=session_id_filter)
        if risk_filter == "high":
            qs = qs.filter(max_score__gt=0.75)
        elif risk_filter == "medium":
            qs = qs.filter(max_score__gt=0.5, max_score__lte=0.75)
        elif risk_filter == "low":
            qs = qs.filter(max_score__lte=0.5)

        paginator = _std_paginator(request)
        page = paginator.paginate_queryset(qs, request)

        session_ids = [d.session_id for d in page]
        device_map = {
            s.session_id: s.device_type
            for s in Session.objects.filter(session_id__in=session_ids)
        }

        results = [
            {
                "id": d.id,
                "session_id": d.session_id,
                "date": d.created_at.date().isoformat(),
                "risk": _risk(float(d.max_score)),
                "scores": {f"S{i}": float(getattr(d, f"score_s{i}")) for i in range(1, 8)},
                "device_type": device_map.get(d.session_id),
            }
            for d in page
        ]
        return paginator.get_paginated_response(results)


# ---------------------------------------------------------------------------
# Recommendations
# ---------------------------------------------------------------------------

def _severity_from_score(score: float) -> str:
    if score >= 0.75:
        return "critical"
    if score >= 0.5:
        return "high"
    if score >= 0.25:
        return "medium"
    return "low"


def _status_map(rec_status: str) -> str:
    return {
        Recommendation.Status.CREATED: "pending",
        Recommendation.Status.VIEWED: "pending",
        Recommendation.Status.IMPLEMENTED: "done",
    }.get(rec_status, "pending")


def _dominant_score_ids(diagnosis) -> list:
    if diagnosis is None:
        return []
    scores = {f"S{i}": float(getattr(diagnosis, f"score_s{i}")) for i in range(1, 8)}
    max_val = max(scores.values())
    return [k for k, v in scores.items() if v >= max_val - 0.001]


SCORE_ORDER = [f"S{i}" for i in range(1, 8)]
MODEL_THRESHOLD = 0.5
MODEL_VERSION = "xgboost-synthetic-mvp"
DATASET_TYPE = "synthetic_mvp"


def _abandoned_prediction_count(qs) -> int:
    return qs.filter(
        Q(business_outcome__in=["abandoned", "abandon"])
        | Q(business_outcome="unknown", predicted_class__in=["abandoned", "abandon"])
    ).count()


def _converted_prediction_count(qs) -> int:
    return qs.filter(
        Q(business_outcome__in=["converted", "convert"])
        | Q(business_outcome="unknown", predicted_class__in=["converted", "convert"])
    ).count()


def _score_dict(diagnosis) -> dict[str, float]:
    return {f"S{i}": float(getattr(diagnosis, f"score_s{i}")) for i in range(1, 8)}


def _reason_label(code: str | None) -> str:
    if code in REASON_INFO:
        return REASON_INFO[code].label
    return code or "Unknown"


def _severity(value: float) -> str:
    if value >= 0.75:
        return "high"
    if value >= 0.5:
        return "medium"
    return "low"


def _api_status(model_status: str) -> str:
    return {
        Recommendation.Status.CREATED: "new",
        Recommendation.Status.VIEWED: "in_progress",
        Recommendation.Status.IN_PROGRESS: "in_progress",
        Recommendation.Status.IMPLEMENTED: "done",
        Recommendation.Status.DISMISSED: "dismissed",
    }.get(model_status, "new")


def _model_status(api_status: str) -> str | None:
    return {
        "new": Recommendation.Status.CREATED,
        "in_progress": Recommendation.Status.IN_PROGRESS,
        "done": Recommendation.Status.IMPLEMENTED,
        "dismissed": Recommendation.Status.DISMISSED,
    }.get(api_status)


def _fallback_recommendation_payload(diagnosis, rec=None) -> dict:
    code = getattr(diagnosis, "dominant_reason", None) or "S1"
    label = getattr(diagnosis, "reason_label", None) or _reason_label(code)
    text = getattr(rec, "text_mn", "") if rec is not None else ""
    score = max(_score_dict(diagnosis).values()) if diagnosis is not None else 0.0
    priority = "high" if score >= 0.75 else "medium" if score >= 0.5 else "low"
    return {
        "title": f"Address {label}",
        "summary": text or f"Review sessions where {code} is dominant and remove the strongest checkout barrier.",
        "reason_code": code,
        "priority": priority,
        "effort": "medium",
        "expected_impact": "Reduce checkout abandonment and improve conversion rate.",
        "evidence": [
            f"Dominant reason is {code}.",
            f"Abandonment probability is {getattr(diagnosis, 'abandonment_probability', 0) or 0:.2f}.",
        ],
        "action_steps": [
            "Inspect the affected checkout step.",
            "Change one visible barrier at a time.",
            "Track abandonment rate after the change.",
        ],
        "warning": "Generated by deterministic fallback because structured Gemini output is unavailable.",
        "source": "fallback",
    }


def _recommendation_payload(rec, diagnosis=None) -> dict | None:
    if rec is None:
        return None
    diagnosis = diagnosis or getattr(rec, "diagnosis", None)
    raw = rec.text_mn or ""
    parsed = None
    if raw.strip().startswith("{"):
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = None
    payload = parsed if isinstance(parsed, dict) else _fallback_recommendation_payload(diagnosis, rec)
    payload.setdefault("source", "gemini" if parsed else "fallback")
    payload.setdefault("reason_code", getattr(diagnosis, "dominant_reason", None) or "S1")
    payload.setdefault("title", f"Address {_reason_label(payload.get('reason_code'))}")
    payload.setdefault("summary", raw)
    payload.setdefault("priority", "medium")
    payload.setdefault("effort", "medium")
    payload.setdefault("expected_impact", "Reduce cart abandonment.")
    payload.setdefault("evidence", [])
    payload.setdefault("action_steps", [])
    payload.setdefault("warning", "" if parsed else "Structured recommendation was not available.")
    return {
        "id": rec.id,
        "title": payload["title"],
        "summary": payload["summary"],
        "body": payload["summary"],
        "reason_code": payload["reason_code"],
        "reason_label": _reason_label(payload["reason_code"]),
        "priority": payload["priority"],
        "effort": payload["effort"],
        "expected_impact": payload["expected_impact"],
        "evidence": payload["evidence"],
        "action_steps": payload["action_steps"],
        "warning": payload["warning"],
        "source": payload["source"],
        "status": _api_status(rec.status),
        "created_at": rec.created_at,
        "session_id": getattr(diagnosis, "session_id", None),
    }


def _prediction_contract(pred) -> dict | None:
    if pred is None:
        return None
    probability = pred.abandonment_probability
    if probability is None:
        probability = pred.prediction_score
    ml_predicted_class = pred.predicted_class or ("abandoned" if probability >= MODEL_THRESHOLD else "converted")
    business_outcome = getattr(pred, "business_outcome", None) or ml_predicted_class
    predicted_class = business_outcome if getattr(pred, "prediction_overridden", False) else ml_predicted_class
    return {
        "predicted_class": predicted_class,
        "predicted_label": 1 if predicted_class in {"abandoned", "abandon"} else 0,
        "ml_predicted_class": ml_predicted_class,
        "business_outcome": business_outcome,
        "prediction_overridden": bool(getattr(pred, "prediction_overridden", False)),
        "override_reason": getattr(pred, "override_reason", "") or "",
        "abandonment_probability": round(float(probability or 0.0), 4),
        "model_name": pred.model_variant or "xgboost",
        "model_version": pred.model_version or MODEL_VERSION,
        "threshold": MODEL_THRESHOLD,
        "confidence": round(float(pred.confidence or max(probability or 0, 1 - (probability or 0))), 4),
    }


def _diagnosis_contract(diagnosis) -> dict | None:
    if diagnosis is None:
        return None
    scores = _score_dict(diagnosis)
    dominant = diagnosis.dominant_reason or max(scores, key=lambda key: scores[key])
    return {
        "id": diagnosis.id,
        "scores": scores,
        "dominant_reason": dominant,
        "reason_label": diagnosis.reason_label or _reason_label(dominant),
        "explanation": diagnosis.explanation or REASON_INFO.get(dominant, REASON_INFO["S1"]).explanation,
        "severity": _severity(scores[dominant]),
    }


def _top_features_from(prediction=None, diagnosis=None) -> list[dict]:
    if diagnosis is not None and isinstance(diagnosis.top_features, list) and diagnosis.top_features:
        return diagnosis.top_features[:8]
    shap = getattr(prediction, "shap_values", None) or {}
    if not isinstance(shap, dict):
        return []
    return [
        {"feature": key, "value": None, "importance": round(abs(float(value)), 6)}
        for key, value in sorted(shap.items(), key=lambda item: abs(float(item[1])), reverse=True)[:8]
    ]


def _event_timeline(session_id: str, session=None) -> list[dict]:
    events = []
    for index, event in enumerate(fetch_session_events(session_id)):
        events.append({
            "id": str(index + 1),
            "type": event.get("event_type") or event.get("type") or "event",
            "timestamp": event.get("_created_at") or event.get("timestamp"),
            "page": event.get("page") or event.get("page_url") or event.get("url") or "",
        })
    if not events and session is not None:
        for index, event in enumerate(getattr(session, "event_sequence", []) or []):
            event_type = event.get("event_type") if isinstance(event, dict) else event
            events.append({
                "id": str(index + 1),
                "type": str(event_type or "event"),
                "timestamp": None,
                "page": "",
            })
    return events


def _dashboard_session_row(session, diagnosis=None) -> dict:
    prediction = _prediction_contract(getattr(session, "prediction", None))
    diagnosis_payload = _diagnosis_contract(diagnosis)
    rec = _recommendation_payload(getattr(diagnosis, "recommendation", None), diagnosis) if diagnosis else None
    return {
        "session_id": session.session_id,
        "visitor_id": session.visitor_id,
        "created_at": session.created_at,
        "started_at": session.started_at,
        "ended_at": session.ended_at,
        "device_type": session.device_type or "unknown",
        "event_count": session.event_count,
        "page_views": session.page_views,
        "cart_value": None,
        "session_state": getattr(session, "session_state", "UNKNOWN"),
        "has_purchase_success": getattr(session, "has_purchase_success", False),
        "business_outcome": prediction.get("business_outcome") if prediction else getattr(session, "session_state", "UNKNOWN").lower(),
        "prediction": prediction,
        "diagnosis": diagnosis_payload,
        "recommendation_status": rec["status"] if rec else None,
    }


def _diagnosis_queryset(tenant):
    return Diagnosis.objects.filter(tenant=tenant).select_related("recommendation")


def _daily_trend(tenant, days: int = 7) -> list[dict]:
    today = timezone.localdate()
    rows = []
    for offset in range(days - 1, -1, -1):
        day = today - timedelta(days=offset)
        predictions = PredictionResult.objects.filter(tenant=tenant, created_at__date=day)
        total = predictions.count()
        abandoned = _abandoned_prediction_count(predictions)
        rows.append({
            "date": day.isoformat(),
            "sessions": Session.objects.filter(tenant=tenant, created_at__date=day).count(),
            "abandoned": abandoned,
            "converted": max(total - abandoned, 0),
            "abandonment_rate": round(abandoned / total, 4) if total else 0.0,
        })
    return rows


def _reason_summary(tenant) -> list[dict]:
    diagnoses = list(_diagnosis_queryset(tenant))
    results = []
    for code in SCORE_ORDER:
        score_field = f"score_s{code[1]}"
        values = [float(getattr(d, score_field)) for d in diagnoses]
        avg = sum(values) / len(values) if values else 0.0
        dominant_count = sum(
            1
            for d in diagnoses
            if (d.dominant_reason or max(_score_dict(d), key=lambda key: _score_dict(d)[key])) == code
        )
        info = REASON_INFO[code]
        results.append({
            "code": code,
            "label": info.label,
            "average_score": round(avg, 4),
            "dominant_sessions": dominant_count,
            "severity": _severity(avg),
            "explanation": info.explanation,
            "recommended_action": _fallback_recommendation_payload(
                diagnoses[0] if diagnoses else None,
                None,
            )["action_steps"][0] if diagnoses else "Collect diagnosed sessions first.",
        })
    return results


def _funnel(tenant) -> list[dict]:
    total = Session.objects.filter(tenant=tenant).count()
    viewed = Session.objects.filter(tenant=tenant, page_views__gt=0).count()
    cart_like = Session.objects.filter(tenant=tenant, event_count__gte=3).count()
    checkout_like = PredictionResult.objects.filter(tenant=tenant).count()
    converted = _converted_prediction_count(PredictionResult.objects.filter(tenant=tenant))
    stages = [
        ("page_view", total),
        ("product_view", viewed),
        ("add_to_cart", cart_like),
        ("cart_view", cart_like),
        ("checkout_start", checkout_like),
        ("purchase_success", converted),
    ]
    return [
        {
            "step": step,
            "sessions": count,
            "drop_percent": round((1 - count / stages[index - 1][1]) * 100, 1)
            if index > 0 and stages[index - 1][1] else 0.0,
        }
        for index, (step, count) in enumerate(stages)
    ]


class DashboardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        sessions = Session.objects.filter(tenant=tenant)
        predictions = PredictionResult.objects.filter(tenant=tenant)
        diagnoses = _diagnosis_queryset(tenant)
        total_sessions = sessions.count()
        total_predictions = predictions.count()
        abandoned = _abandoned_prediction_count(predictions)
        converted = _converted_prediction_count(predictions)
        high_risk = predictions.filter(abandonment_probability__gte=MODEL_THRESHOLD).count()
        avg_probability = predictions.aggregate(v=Avg("abandonment_probability"))["v"] or 0.0
        latest_diagnosis = diagnoses.order_by("-created_at").first()
        latest_rec = (
            Recommendation.objects.filter(tenant=tenant)
            .select_related("diagnosis")
            .order_by("-created_at")
            .first()
        )
        reason_rows = _reason_summary(tenant)
        top_reason = max(reason_rows, key=lambda item: (item["dominant_sessions"], item["average_score"]))
        recent_sessions = list(
            sessions.select_related("prediction").order_by("-created_at")[:8]
        )
        diagnosis_map = {
            d.session_id: d
            for d in diagnoses.filter(session_id__in=[s.session_id for s in recent_sessions])
        }

        return Response({
            "summary": {
                "total_sessions": total_sessions,
                "abandoned_sessions": abandoned,
                "converted_sessions": converted,
                "abandonment_rate": round(abandoned / total_predictions, 4) if total_predictions else 0.0,
                "conversion_rate": round(converted / total_predictions, 4) if total_predictions else 0.0,
                "high_risk_sessions": high_risk,
                "average_abandonment_probability": round(float(avg_probability), 4),
                "active_recommendations": Recommendation.objects.filter(
                    tenant=tenant,
                    status__in=[Recommendation.Status.CREATED, Recommendation.Status.VIEWED, Recommendation.Status.IN_PROGRESS],
                ).count(),
            },
            "model": {
                "active_model": "xgboost",
                "model_version": getattr(latest_diagnosis, "model_version", None) or MODEL_VERSION,
                "threshold": MODEL_THRESHOLD,
                "dataset_type": DATASET_TYPE,
            },
            "top_reason": {
                "score": top_reason["code"],
                "label": top_reason["label"],
                "value": top_reason["average_score"],
                "explanation": top_reason["explanation"],
            },
            "latest_recommendation": _recommendation_payload(latest_rec, getattr(latest_rec, "diagnosis", None)) if latest_rec else None,
            "trend": _daily_trend(tenant, days=7),
            "funnel": _funnel(tenant),
            "reasons": reason_rows,
            "recent_sessions": [_dashboard_session_row(s, diagnosis_map.get(s.session_id)) for s in recent_sessions],
        })


class DashboardTrendsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        raw_range = request.query_params.get("range", "7d")
        days = 30 if raw_range == "30d" else 14 if raw_range == "14d" else 7
        return Response({"range": raw_range, "trend": _daily_trend(tenant, days=days)})


class DashboardReasonsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        rows = _reason_summary(tenant)
        return Response({
            "dominant_reason_formula": "dominant_reason = argmax(S1, S2, S3, S4, S5, S6, S7)",
            "reasons": rows,
            "distribution": [{"code": r["code"], "label": r["label"], "sessions": r["dominant_sessions"]} for r in rows],
        })


class DashboardSessionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = Session.objects.filter(tenant=tenant).select_related("prediction").order_by("-created_at")
        search = request.query_params.get("search")
        predicted_class = request.query_params.get("predicted_class")
        dominant_reason = request.query_params.get("dominant_reason")
        high_risk = request.query_params.get("high_risk")

        if search:
            qs = qs.filter(Q(session_id__icontains=search) | Q(visitor_id__icontains=search))
        if predicted_class:
            qs = qs.filter(prediction__business_outcome=predicted_class)
        if high_risk in {"true", "1", "yes"}:
            qs = qs.filter(prediction__abandonment_probability__gte=MODEL_THRESHOLD)
        if dominant_reason in SCORE_ORDER:
            session_ids = Diagnosis.objects.filter(
                tenant=tenant,
                dominant_reason=dominant_reason,
            ).values_list("session_id", flat=True)
            qs = qs.filter(session_id__in=session_ids)

        paginator = _std_paginator(request)
        page = paginator.paginate_queryset(qs, request)
        diagnosis_map = {
            d.session_id: d
            for d in _diagnosis_queryset(tenant).filter(session_id__in=[item.session_id for item in page])
        }
        results = [_dashboard_session_row(item, diagnosis_map.get(item.session_id)) for item in page]
        return paginator.get_paginated_response(results)


class DashboardSessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id: str):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        session = (
            Session.objects.filter(tenant=tenant, session_id=session_id)
            .select_related("prediction")
            .first()
        )
        if not session:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        diagnosis = _diagnosis_queryset(tenant).filter(session_id=session_id).first()
        rec = _recommendation_payload(getattr(diagnosis, "recommendation", None), diagnosis) if diagnosis else None
        prediction = getattr(session, "prediction", None)
        return Response({
            "session_id": session.session_id,
            "organization_id": getattr(tenant, "external_id", None) or tenant.id,
            "tenant_id": tenant.id,
            "visitor_id": session.visitor_id,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "device_type": session.device_type,
            "event_count": session.event_count,
            "page_views": session.page_views,
            "session_state": session.session_state,
            "has_purchase_success": session.has_purchase_success,
            "prediction": _prediction_contract(prediction),
            "diagnosis": _diagnosis_contract(diagnosis),
            "top_features": _top_features_from(prediction, diagnosis),
            "events": _event_timeline(session.session_id, session),
            "recommendation": rec,
            "developer_details": {
                "session": _dashboard_session_row(session, diagnosis),
                "shap_values": getattr(prediction, "shap_values", {}) if prediction else {},
                "feature_vector": getattr(prediction, "feature_vector", {}) if prediction else {},
                "outcome_metadata": getattr(prediction, "outcome_metadata", {}) if prediction else {},
            },
        })


class DashboardRecommendationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        recs = (
            Recommendation.objects.filter(tenant=tenant)
            .select_related("diagnosis")
            .order_by("-created_at")
        )
        results = [_recommendation_payload(rec, rec.diagnosis) for rec in recs]
        stats = {
            "total": len(results),
            "new": sum(1 for item in results if item["status"] == "new"),
            "in_progress": sum(1 for item in results if item["status"] == "in_progress"),
            "done": sum(1 for item in results if item["status"] == "done"),
            "dismissed": sum(1 for item in results if item["status"] == "dismissed"),
        }
        return Response({"results": results, "stats": stats})


class DashboardRecommendationStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, id: int):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        rec = Recommendation.objects.filter(id=id, tenant=tenant).select_related("diagnosis").first()
        if not rec:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        new_status = _model_status(str(request.data.get("status", "")).strip())
        if new_status is None:
            return Response({"detail": "status must be new, in_progress, done, or dismissed"}, status=status.HTTP_400_BAD_REQUEST)
        rec.status = new_status
        if new_status == Recommendation.Status.IMPLEMENTED:
            rec.implemented_at = timezone.now()
            rec.implemented_by = request.user
            rec.save(update_fields=["status", "implemented_at", "implemented_by"])
        else:
            rec.implemented_at = None
            rec.implemented_by = None
            rec.save(update_fields=["status", "implemented_at", "implemented_by"])
        return Response(_recommendation_payload(rec, rec.diagnosis))


def _observer_tenant_predicate(tenant=None) -> tuple[str, list[str]]:
    if tenant is None:
        return "", []
    tenant_external_id = str(getattr(tenant, "external_id", "") or "")
    if not tenant_external_id:
        return "", []

    predicate = "((payload ->> 'tenant_id') = %s OR (payload ->> 'tenantExternalId') = %s)"
    params = [tenant_external_id, tenant_external_id]

    default_tenant_ids = {
        value
        for value in (
            os.getenv("SESSION_DEFAULT_TENANT_ID"),
            os.getenv("DEMO_TENANT_EXTERNAL_ID"),
            "00000000-0000-0000-0000-000000000001",
        )
        if value
    }
    if tenant_external_id in default_tenant_ids:
        predicate = (
            f"({predicate} OR (COALESCE(payload ->> 'tenant_id', '') = '' "
            "AND COALESCE(payload ->> 'tenantExternalId', '') = ''))"
        )
    return predicate, params


def _last_observer_events(limit: int = 10, tenant=None) -> list[dict]:
    tenant_predicate, tenant_params = _observer_tenant_predicate(tenant)
    where_sql = f"WHERE {tenant_predicate}" if tenant_predicate else ""
    try:
        with connections["observer"].cursor() as cursor:
            cursor.execute(
                f"""
                SELECT session_id, event_type, created_at
                FROM raw_events
                {where_sql}
                ORDER BY created_at DESC
                LIMIT %s
                """,
                [*tenant_params, limit],
            )
            rows = cursor.fetchall()
    except Exception:
        return []
    return [
        {
            "session_id": row[0],
            "event_type": row[1],
            "created_at": row[2].isoformat() if hasattr(row[2], "isoformat") else str(row[2]),
        }
        for row in rows
    ]


def _iso(value) -> str:
    if value is None:
        return ""
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _service_base_url(env_name: str, docker_host: str, port: int) -> str:
    configured = os.getenv(env_name)
    if configured:
        return configured.rstrip("/")
    bootstrap = getattr(settings, "KAFKA_BOOTSTRAP_SERVERS", "")
    docker_like = os.getenv("DB_HOST") == "postgres" or "kafka:" in bootstrap
    host = docker_host if docker_like else "localhost"
    return f"http://{host}:{port}"


def _health_from_http(status_code: int, payload: dict) -> str:
    reported = str(payload.get("status") or payload.get("ready") or "").lower()
    if 200 <= status_code < 300:
        if reported in {"degraded", "warn", "warning", "not_ready", "false"}:
            return "degraded"
        return "healthy"
    if status_code in {207, 429, 500, 502, 503, 504}:
        return "degraded"
    return "down"


def _http_service_status(
    *,
    service_id: str,
    name: str,
    base_url: str,
    health_path: str = "/health",
    version_key: str | None = None,
) -> dict:
    url = f"{base_url.rstrip('/')}{health_path}"
    try:
        response = requests.get(url, timeout=1.5)
        try:
            payload = response.json() if response.content else {}
        except ValueError:
            payload = {}
        latency_ms = int(response.elapsed.total_seconds() * 1000)
        health = _health_from_http(response.status_code, payload)
        reported = payload.get("status") or payload.get("service") or f"HTTP {response.status_code}"
        return {
            "id": service_id,
            "name": name,
            "category": "service",
            "health": health,
            "latency_p95_ms": latency_ms,
            "version": payload.get(version_key) if version_key else None,
            "url": base_url,
            "last_heartbeat": "now" if health in {"healthy", "degraded"} else "unreachable",
            "detail": str(reported),
        }
    except requests.RequestException as exc:
        return {
            "id": service_id,
            "name": name,
            "category": "service",
            "health": "down",
            "url": base_url,
            "last_heartbeat": "unreachable",
            "detail": f"unreachable: {exc.__class__.__name__}",
        }


def _postgres_status() -> dict:
    started = time.monotonic()
    try:
        from django.db import connection
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
        return {
            "id": "postgres",
            "name": "Postgres",
            "category": "infra",
            "health": "healthy",
            "latency_p95_ms": int((time.monotonic() - started) * 1000),
            "last_heartbeat": "now",
            "detail": "default database reachable",
        }
    except Exception as exc:
        return {
            "id": "postgres",
            "name": "Postgres",
            "category": "infra",
            "health": "down",
            "last_heartbeat": "unreachable",
            "detail": f"failed: {exc.__class__.__name__}",
        }


def _redis_status() -> tuple[dict, dict | None]:
    started = time.monotonic()
    ready_payload = None
    try:
        import redis as _redis
        client = _redis.Redis.from_url(settings.REDIS_URL, socket_connect_timeout=1, socket_timeout=1)
        client.ping()
        raw_ready = client.get("main:prediction_done_consumer:ready")
        if raw_ready:
            try:
                ready_payload = json.loads(raw_ready.decode("utf-8") if isinstance(raw_ready, bytes) else raw_ready)
            except (TypeError, ValueError):
                ready_payload = {"ready": False, "reason": "invalid readiness payload"}
        info = {}
        try:
            info = client.info(section="server")
        except Exception:
            info = {}
        return {
            "id": "redis",
            "name": "Redis",
            "category": "infra",
            "health": "healthy",
            "latency_p95_ms": int((time.monotonic() - started) * 1000),
            "version": info.get("redis_version"),
            "last_heartbeat": "now",
            "detail": "ping ok",
        }, ready_payload
    except Exception as exc:
        return {
            "id": "redis",
            "name": "Redis",
            "category": "infra",
            "health": "down",
            "last_heartbeat": "unreachable",
            "detail": f"failed: {exc.__class__.__name__}",
        }, None


def _parse_kafka_targets() -> list[tuple[str, int]]:
    targets = []
    bootstrap = getattr(settings, "KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
    for item in str(bootstrap).split(","):
        item = item.strip().replace("PLAINTEXT://", "")
        if not item:
            continue
        host, _, port_text = item.rpartition(":")
        if not host:
            host = item
            port_text = "9092"
        try:
            targets.append((host, int(port_text)))
        except ValueError:
            continue
    return targets or [("localhost", 9092)]


def _kafka_status() -> dict:
    started = time.monotonic()
    errors = []
    for host, port in _parse_kafka_targets():
        try:
            with socket.create_connection((host, port), timeout=1):
                return {
                    "id": "kafka",
                    "name": "Kafka",
                    "category": "infra",
                    "health": "healthy",
                    "latency_p95_ms": int((time.monotonic() - started) * 1000),
                    "last_heartbeat": "now",
                    "detail": f"reachable at {host}:{port}",
                }
        except OSError as exc:
            errors.append(f"{host}:{port} {exc.__class__.__name__}")
    return {
        "id": "kafka",
        "name": "Kafka",
        "category": "infra",
        "health": "down",
        "last_heartbeat": "unreachable",
        "detail": "; ".join(errors) or "no bootstrap targets",
    }


def _duckdb_status() -> dict:
    try:
        import duckdb
        path = getattr(settings, "DUCKDB_PATH", "")
        if path and (path == ":memory:" or os.path.exists(path)):
            con = duckdb.connect(path, read_only=path != ":memory:")
            con.execute("SELECT 1").fetchone()
            con.close()
            return {
                "id": "duckdb",
                "name": "DuckDB",
                "category": "infra",
                "health": "healthy",
                "last_heartbeat": "now",
                "detail": "analytics store reachable",
            }
        return {
            "id": "duckdb",
            "name": "DuckDB",
            "category": "infra",
            "health": "unknown",
            "last_heartbeat": "not initialized",
            "detail": "analytics store not initialized",
        }
    except Exception as exc:
        return {
            "id": "duckdb",
            "name": "DuckDB",
            "category": "infra",
            "health": "degraded",
            "last_heartbeat": "unreachable",
            "detail": f"failed: {exc.__class__.__name__}",
        }


def _main_consumer_status(ready_payload: dict | None) -> dict:
    health = "unknown"
    detail = "readiness heartbeat missing"
    last_heartbeat = "unknown"
    if ready_payload:
        is_ready = bool(ready_payload.get("ready"))
        health = "healthy" if is_ready else "degraded"
        detail = "prediction_done consumer ready" if is_ready else f"not ready: {ready_payload.get('reason', '')}"
        updated_at = ready_payload.get("updated_at")
        if updated_at:
            try:
                last_heartbeat = datetime.fromtimestamp(float(updated_at), tz=datetime_timezone.utc).isoformat()
            except (TypeError, ValueError, OSError):
                last_heartbeat = "invalid heartbeat"
    return {
        "id": "main",
        "name": "Main Consumer",
        "category": "service",
        "health": health,
        "url": "http://main_service:8000" if os.getenv("DB_HOST") == "postgres" else "http://localhost:8000",
        "last_heartbeat": last_heartbeat,
        "detail": detail,
    }


def _observer_event_count_since(since, tenant=None) -> int:
    tenant_predicate, tenant_params = _observer_tenant_predicate(tenant)
    extra_sql = f" AND {tenant_predicate}" if tenant_predicate else ""
    try:
        with connections["observer"].cursor() as cursor:
            cursor.execute(
                f"SELECT COUNT(*) FROM raw_events WHERE created_at >= %s{extra_sql}",
                [since, *tenant_params],
            )
            row = cursor.fetchone()
            return int(row[0] or 0)
    except Exception:
        return 0


class PipelineMonitorView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        since = now - timedelta(hours=24)

        redis_status, consumer_ready = _redis_status()
        services = [
            _http_service_status(
                service_id="observer",
                name="Observer",
                base_url=_service_base_url("OBSERVER_INTERNAL_URL", "observer", 8001),
            ),
            _http_service_status(
                service_id="session",
                name="Session Service",
                base_url=_service_base_url("SESSION_SERVICE_INTERNAL_URL", "session_service", 8002),
            ),
            _http_service_status(
                service_id="feature",
                name="Feature Service",
                base_url=_service_base_url("FEATURE_SERVICE_INTERNAL_URL", "feature_service", 8003),
            ),
            _http_service_status(
                service_id="ml",
                name="ML Service",
                base_url=_service_base_url("ML_SERVICE_INTERNAL_URL", "ml_service", 8004),
                version_key="model_version",
            ),
            _main_consumer_status(consumer_ready),
        ]
        infra = [_kafka_status(), _postgres_status(), redis_status, _duckdb_status()]

        prediction_qs = (
            PredictionResult.objects.filter(tenant=tenant)
            .select_related("session")
            .order_by("-predicted_at", "-created_at")
        )
        latest_predictions = []
        latest_features = []
        for item in prediction_qs[:10]:
            created = item.predicted_at or item.created_at
            session_id = item.session.session_id
            shap_values = item.shap_values if isinstance(item.shap_values, (dict, list)) else {}
            latest_predictions.append({
                "session_id": session_id,
                "prediction": item.predicted_class,
                "abandonment_probability": float(item.abandonment_probability if item.abandonment_probability is not None else item.prediction_score),
                "model_version": item.model_version or item.model_variant,
                "created_at": _iso(created),
            })
            latest_features.append({
                "session_id": session_id,
                "features_count": len(shap_values),
                "produced_at": _iso(created),
            })

        latest_sessions = [
            {
                "session_id": item.session_id,
                "visitor_id": item.visitor_id,
                "started_at": _iso(item.started_at),
                "events": item.event_count,
                "status": item.session_state.lower() if item.session_state else "unknown",
            }
            for item in Session.objects.filter(tenant=tenant).order_by("-started_at", "-created_at")[:10]
        ]

        failed_diagnoses = Diagnosis.objects.filter(
            tenant=tenant,
            status=Diagnosis.Status.FAILED,
            created_at__gte=since,
        ).order_by("-created_at")
        recent_failures = [
            {
                "service": "main",
                "message": f"Diagnosis failed for session {item.session_id}",
                "occurred_at": _iso(item.created_at),
            }
            for item in failed_diagnoses[:10]
        ]
        for item in [*services, *infra]:
            if item["health"] in {"down", "degraded"} and len(recent_failures) < 10:
                recent_failures.append({
                    "service": item["id"],
                    "message": item.get("detail") or f"{item['name']} is {item['health']}",
                    "occurred_at": _iso(now),
                })

        sessions_24h = Session.objects.filter(tenant=tenant, created_at__gte=since).count()
        predictions_24h = PredictionResult.objects.filter(tenant=tenant, created_at__gte=since).count()
        return Response({
            "refreshed_at": _iso(now),
            "services": services,
            "infra": infra,
            "throughput": {
                "events_24h": _observer_event_count_since(since, tenant),
                "sessions_24h": sessions_24h,
                "features_24h": predictions_24h,
                "predictions_24h": predictions_24h,
                "failures_24h": failed_diagnoses.count(),
                "consumer_lag": 0 if consumer_ready and consumer_ready.get("ready") else 1,
            },
            "latest_events": _last_observer_events(limit=10, tenant=tenant),
            "latest_sessions": latest_sessions,
            "latest_features": latest_features,
            "latest_predictions": latest_predictions,
            "recent_failures": recent_failures,
        })


class DashboardIntegrationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        demo_key = os.getenv("DEMO_OBSERVER_API_KEY", "tk_full_demo_mvp")
        observer_url = os.getenv("OBSERVER_PUBLIC_URL", "http://localhost:8001")
        snippet = (
            f'<script src="{observer_url}/static/snippet/track.js?key={demo_key}" '
            f'data-tenant-id="{tenant.external_id}" async></script>'
        )
        return Response({
            "observer": {
                "url": observer_url,
                "health": "runtime check required",
                "demo_api_key": demo_key,
                "snippet": snippet,
            },
            "kafka": {
                "health": "runtime check required",
                "topics": ["raw_events", "session_enriched", "feature_ready", "prediction_done"],
            },
            "demo_shop": {"url": "http://localhost:3000"},
            "dashboard": {"url": "http://localhost:3001"},
            "last_events": _last_observer_events(limit=10, tenant=tenant),
        })


class AnalyticsRecommendationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        recs = (
            Recommendation.objects.filter(tenant=tenant)
            .select_related("diagnosis")
            .order_by("-created_at")[:50]
        )
        # Auto-mark all unviewed recommendations as viewed on first read
        unviewed_ids = [r.pk for r in recs if r.status == Recommendation.Status.CREATED]
        if unviewed_ids:
            Recommendation.objects.filter(pk__in=unviewed_ids).update(
                status=Recommendation.Status.VIEWED
            )

        recommendations = []
        for rec in recs:
            score = float(rec.dominant_score)
            display_status = rec.status if rec.pk not in unviewed_ids else Recommendation.Status.VIEWED
            recommendations.append({
                "id": rec.id,
                "title": (rec.text_mn or "")[:80] or "Recommendation",
                "severity": _severity_from_score(score),
                "description": rec.text_mn or "",
                "status": _status_map(display_status),
                "score_ids": _dominant_score_ids(getattr(rec, "diagnosis", None)),
            })
        return Response({"recommendations": recommendations})


class AnalyticsRecommendationImplementView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, id: int):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        allowed = TeamMember.objects.filter(
            user=request.user, tenant=tenant,
            role__in=[TeamMember.Role.OWNER, TeamMember.Role.MEMBER],
        ).exists()
        if not allowed:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        rec = Recommendation.objects.filter(id=id, tenant=tenant).select_related("diagnosis").first()
        if not rec:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if rec.status != Recommendation.Status.IMPLEMENTED:
            rec.mark_implemented(user_id=request.user.id)

        return Response({
            "id": rec.id,
            "status": rec.status,
            "implemented_at": rec.implemented_at,
            "implemented_by": rec.implemented_by_id,
        })


# ---------------------------------------------------------------------------
# Sessions
# ---------------------------------------------------------------------------

def _prediction_block(pred):
    if pred is None:
        return None
    return {
        "abandonment_probability": pred.abandonment_probability,
        "prediction": pred.predicted_class,
        "confidence": pred.confidence,
        "model_variant": pred.model_variant,
        "model_version": pred.model_version,
    }


def _diagnosis_block(diagnosis):
    if diagnosis is None:
        return None
    scores = {f"S{i}": float(getattr(diagnosis, f"score_s{i}")) for i in range(1, 8)}
    dominant = diagnosis.dominant_reason or max(scores, key=lambda key: scores[key])
    return {
        "id": diagnosis.id,
        "scores": scores,
        "dominant_reason": dominant,
        "reason_label": diagnosis.reason_label,
        "recommendation": getattr(getattr(diagnosis, "recommendation", None), "text_mn", None),
    }


class SessionsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = Session.objects.filter(tenant=tenant).select_related("prediction").order_by("-created_at")

        model_variant = request.query_params.get("model_variant")
        prediction_filter = request.query_params.get("prediction")
        if model_variant:
            qs = qs.filter(prediction__model_variant=model_variant)
        if prediction_filter:
            qs = qs.filter(prediction__business_outcome=prediction_filter)

        paginator = _std_paginator(request)
        page = paginator.paginate_queryset(qs, request)
        diagnosis_map = {
            d.session_id: d
            for d in Diagnosis.objects.filter(tenant=tenant, session_id__in=[item.session_id for item in page])
            .select_related("recommendation")
        }

        data = [
            {
                "session_id": item.session_id,
                "visitor_id": item.visitor_id,
                "started_at": item.started_at,
                "ended_at": item.ended_at,
                "event_count": item.event_count,
                "page_views": item.page_views,
                "device_type": item.device_type,
                "prediction": _prediction_block(getattr(item, "prediction", None)),
                "diagnosis": _diagnosis_block(diagnosis_map.get(item.session_id)),
            }
            for item in page
        ]
        return paginator.get_paginated_response(data)


class SessionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id: str):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        session = (
            Session.objects.filter(session_id=session_id, tenant=tenant)
            .select_related("prediction")
            .first()
        )
        if not session:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        prediction = getattr(session, "prediction", None)
        diagnosis = (
            Diagnosis.objects.filter(tenant=tenant, session_id=session.session_id)
            .select_related("recommendation")
            .first()
        )
        return Response({
            "session_id": session.session_id,
            "visitor_id": session.visitor_id,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "event_count": session.event_count,
            "page_views": session.page_views,
            "device_type": session.device_type,
            "prediction": _prediction_block(prediction),
            "diagnosis": _diagnosis_block(diagnosis),
            "shap_values": prediction.shap_values if prediction else {},
        })


# ---------------------------------------------------------------------------
# Abandonment rate
# ---------------------------------------------------------------------------

class AbandonmentRateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = PredictionResult.objects.filter(tenant=tenant)
        total = qs.count()
        abandoned = _abandoned_prediction_count(qs)
        rate = (abandoned / total) if total else 0.0

        return Response({
            "rate": round(rate, 4),
            "total": total,
            "abandoned": abandoned,
            "converted": total - abandoned,
        })


# ---------------------------------------------------------------------------
# Feature importance
# ---------------------------------------------------------------------------

class FeatureImportanceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        variant = request.query_params.get("variant")
        try:
            top_n = int(request.query_params.get("top_n", 20))
        except (TypeError, ValueError):
            top_n = 20

        qs = PredictionResult.objects.filter(tenant=tenant)
        if variant:
            qs = qs.filter(model_variant=variant)

        accum: dict[str, list[float]] = {}
        for shap in qs.order_by("-created_at").values_list("shap_values", flat=True)[:10_000]:
            if isinstance(shap, dict):
                for key, value in shap.items():
                    try:
                        accum.setdefault(str(key), []).append(abs(float(value)))
                    except (TypeError, ValueError):
                        continue

        features = [
            {"feature": feat, "mean_abs_shap": round(sum(vals) / len(vals), 6)}
            for feat, vals in accum.items()
            if vals
        ]
        features.sort(key=lambda x: x["mean_abs_shap"], reverse=True)
        return Response({"features": features[:top_n], "model_variant": variant or "all"})


def _prediction_row(item) -> dict:
    return {
        "session_id": item.session.session_id,
        "visitor_id": item.session.visitor_id,
        "model_variant": item.model_variant,
        "abandonment_probability": item.abandonment_probability,
        "prediction": item.predicted_class,
        "confidence": item.confidence,
        "shap_values": item.shap_values,
        "model_version": item.model_version,
        "predicted_at": item.predicted_at,
    }


def _label_to_abandoned(value) -> bool | None:
    normalized = str(value or "").strip().lower()
    if normalized in {"abandon", "abandoned", "abandonment", "true", "1"}:
        return True
    if normalized in {"convert", "converted", "purchase", "purchased", "false", "0"}:
        return False
    return None


def _model_metrics(qs) -> dict:
    tp = tn = fp = fn = 0
    for item in qs:
        predicted = _label_to_abandoned(item.predicted_class)
        actual = _label_to_abandoned(getattr(item, "business_outcome", None))
        if predicted is None or actual is None:
            continue
        if predicted and actual:
            tp += 1
        elif not predicted and not actual:
            tn += 1
        elif predicted and not actual:
            fp += 1
        else:
            fn += 1

    total = tp + tn + fp + fn
    precision = tp / (tp + fp) if (tp + fp) else 0.0
    recall = tp / (tp + fn) if (tp + fn) else 0.0
    return {
        "accuracy": round((tp + tn) / total, 4) if total else 0.0,
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1": round((2 * precision * recall) / (precision + recall), 4) if (precision + recall) else 0.0,
        "roc_auc": None,
        "log_loss": None,
        "confusion_matrix": {
            "true_positive": tp,
            "true_negative": tn,
            "false_positive": fp,
            "false_negative": fn,
        },
    }


def _probability_distribution(qs) -> list[dict]:
    buckets = [{"bucket": f"{i / 10:.1f}-{(i + 1) / 10:.1f}", "count": 0} for i in range(10)]
    for item in qs:
        value = item.abandonment_probability
        if value is None:
            value = item.prediction_score
        try:
            probability = max(0.0, min(1.0, float(value)))
        except (TypeError, ValueError):
            continue
        index = min(9, int(probability * 10))
        buckets[index]["count"] += 1
    return buckets


def _feature_contributions(qs, limit: int = 12) -> list[dict]:
    values: dict[str, list[float]] = {}
    for shap in qs.order_by("-created_at").values_list("shap_values", flat=True)[:10_000]:
        if not isinstance(shap, dict):
            continue
        for key, value in shap.items():
            try:
                values.setdefault(str(key), []).append(float(value))
            except (TypeError, ValueError):
                continue

    rows = []
    for feature, samples in values.items():
        if not samples:
            continue
        mean_signed = sum(samples) / len(samples)
        mean_abs = sum(abs(v) for v in samples) / len(samples)
        if mean_signed > 0.001:
            direction = "increases"
        elif mean_signed < -0.001:
            direction = "decreases"
        else:
            direction = "mixed"
        rows.append({
            "feature": feature,
            "importance": round(mean_abs, 6),
            "shap_mean": round(mean_signed, 6),
            "direction": direction,
        })
    rows.sort(key=lambda row: row["importance"], reverse=True)
    return rows[:limit]


class MLInsightsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = PredictionResult.objects.filter(tenant=tenant).select_related("session")
        latest = qs.order_by("-predicted_at", "-created_at").first()
        trained_at = latest.predicted_at or latest.created_at if latest else timezone.now()
        return Response({
            "refreshed_at": _iso(timezone.now()),
            "model": {
                "model_name": "xgboost",
                "model_version": (latest.model_version if latest and latest.model_version else MODEL_VERSION),
                "variant": (latest.model_variant if latest else "full"),
                "trained_at": _iso(trained_at),
                "threshold": MODEL_THRESHOLD,
                "dataset": "main_service_predictions",
                "prediction_count": qs.count(),
            },
            "metrics": _model_metrics(qs),
            "probability_distribution": _probability_distribution(qs),
            "feature_contributions": _feature_contributions(qs),
        })


# ---------------------------------------------------------------------------
# Predictions list
# ---------------------------------------------------------------------------

class PredictionsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = (
            PredictionResult.objects.filter(tenant=tenant)
            .select_related("session")
            .order_by("-predicted_at", "-created_at")
        )

        model_variant = request.query_params.get("model_variant")
        prediction_filter = request.query_params.get("prediction")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if model_variant:
            qs = qs.filter(model_variant=model_variant)
        if prediction_filter:
            qs = qs.filter(predicted_class=prediction_filter)
        if date_from:
            qs = qs.filter(predicted_at__gte=date_from)
        if date_to:
            qs = qs.filter(predicted_at__lte=date_to)

        paginator = _std_paginator(request)
        page = paginator.paginate_queryset(qs, request)

        data = [_prediction_row(item) for item in page]
        return paginator.get_paginated_response(data)


class PredictionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id: str):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        item = (
            PredictionResult.objects.filter(tenant=tenant, session__session_id=session_id)
            .select_related("session")
            .first()
        )
        if not item:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(_prediction_row(item))


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

class HealthView(APIView):
    permission_classes = []

    def get(self, request):
        checks = {}
        failed = False

        try:
            from django.db import connection
            with connection.cursor() as cur:
                cur.execute("SELECT 1")
            checks["postgresql"] = "ok"
        except Exception as e:
            checks["postgresql"] = f"failed: {e}"
            failed = True

        try:
            import os as _os
            import duckdb
            path = getattr(settings, "DUCKDB_PATH", "")
            if path and _os.path.exists(path):
                con = duckdb.connect(path, read_only=True)
                con.execute("SELECT 1").fetchone()
                con.close()
                checks["duckdb"] = "ok"
            else:
                checks["duckdb"] = "not_initialized"
        except Exception as e:
            checks["duckdb"] = f"failed: {e}"

        try:
            import redis as _redis
            r = _redis.Redis.from_url(settings.REDIS_URL)
            r.ping()
            checks["redis"] = "ok"
            raw_ready = r.get("main:prediction_done_consumer:ready")
            if raw_ready:
                try:
                    ready_payload = json.loads(raw_ready.decode("utf-8") if isinstance(raw_ready, bytes) else raw_ready)
                except (TypeError, ValueError):
                    ready_payload = {"ready": False, "reason": "invalid readiness payload"}
                checks["prediction_done_consumer"] = "ok" if ready_payload.get("ready") else f"not_ready: {ready_payload.get('reason', '')}"
            else:
                checks["prediction_done_consumer"] = "not_ready"
        except Exception as e:
            checks["redis"] = f"failed: {e}"
            failed = True

        try:
            import boto3
            protocol = "https" if settings.MINIO_USE_SSL else "http"
            client = boto3.client(
                "s3",
                endpoint_url=f"{protocol}://{settings.MINIO_ENDPOINT}",
                aws_access_key_id=settings.MINIO_ACCESS_KEY,
                aws_secret_access_key=settings.MINIO_SECRET_KEY,
            )
            client.list_buckets()
            checks["minio"] = "ok"
        except Exception as e:
            checks["minio"] = f"failed: {e}"

        http_status = 503 if failed else 200
        return Response(
            {"status": "degraded" if failed else "ok", "dependencies": checks},
            status=http_status,
        )


# ---------------------------------------------------------------------------
# Ablation summary
# ---------------------------------------------------------------------------

class AblationSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        results = []
        for variant in ["baseline", "extended", "full"]:
            qs = PredictionResult.objects.filter(tenant=tenant, model_variant=variant)
            if date_from:
                qs = qs.filter(predicted_at__gte=date_from)
            if date_to:
                qs = qs.filter(predicted_at__lte=date_to)

            count = qs.count()
            if count == 0:
                results.append({
                    "model_variant": variant,
                    "count": 0,
                    "abandonment_rate": None,
                    "avg_confidence": None,
                    "avg_score": None,
                })
                continue

            abandoned = _abandoned_prediction_count(qs)
            avg_conf = qs.aggregate(v=Avg("confidence"))["v"] or 0.0
            avg_score = qs.aggregate(v=Avg("prediction_score"))["v"] or 0.0
            results.append({
                "model_variant": variant,
                "count": count,
                "abandonment_rate": round(abandoned / count, 4),
                "avg_confidence": round(float(avg_conf), 4),
                "avg_score": round(float(avg_score), 4),
            })

        baseline = next((r for r in results if r["model_variant"] == "baseline"), None)
        full = next((r for r in results if r["model_variant"] == "full"), None)
        comparison = None
        if baseline and full and baseline.get("count") and full.get("count"):
            comparison = {
                "abandonment_rate_delta": round(full["abandonment_rate"] - baseline["abandonment_rate"], 4),
                "confidence_delta": round(full["avg_confidence"] - baseline["avg_confidence"], 4),
            }

        return Response({
            "tenant_id": tenant.id,
            "date_range": {"from": date_from, "to": date_to},
            "variants": results,
            "comparison": comparison,
        })


# ---------------------------------------------------------------------------
# Export trigger
# ---------------------------------------------------------------------------

class ExportTriggerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ExportTriggerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        export_type = serializer.validated_data["export_type"]
        model_variant = serializer.validated_data.get("model_variant")

        task = export_to_minio.delay(
            export_type=export_type,
            model_variant=model_variant,
            tenant_id=tenant.id,
        )
        return Response({"status": "queued", "task_id": task.id}, status=202)


# ---------------------------------------------------------------------------
# Diagnosis list + detail
# ---------------------------------------------------------------------------

def _diagnosis_row(d, device_map=None) -> dict:
    max_s = float(d.max_score)
    scores = {f"S{i}": float(getattr(d, f"score_s{i}")) for i in range(1, 8)}
    dominant_reason = getattr(d, "dominant_reason", None)
    if not dominant_reason:
        dominant_reason = max(scores, key=lambda key: scores[key])
    recommendation = getattr(d, "recommendation", None)
    return {
        "id": d.id,
        "session_id": d.session_id,
        "risk": _risk(max_s),
        "scores": scores,
        "dominant_reason": dominant_reason,
        "dominant_score_key": dominant_reason,
        "reason_label": getattr(d, "reason_label", "") or dominant_reason,
        "explanation": getattr(d, "explanation", "") or "",
        "dominant_score": round(max_s, 4),
        "prediction_score": round(float(d.abandonment_probability) if d.abandonment_probability is not None else max_s, 4),
        "abandonment_probability": d.abandonment_probability,
        "predicted_label": d.predicted_label,
        "predicted_class": d.predicted_class,
        "model_version": d.model_version,
        "top_features": d.top_features,
        "recommendation": getattr(recommendation, "text_mn", None),
        "created_at": d.created_at,
        **({"device_type": (device_map or {}).get(d.session_id)} if device_map is not None else {}),
    }


class DiagnosisListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = (
            Diagnosis.objects.filter(tenant=tenant)
            .select_related("recommendation")
            .annotate(max_score=Greatest(
                "score_s1", "score_s2", "score_s3", "score_s4",
                "score_s5", "score_s6", "score_s7",
            ))
            .order_by("-created_at")
        )

        search = request.query_params.get("search")
        session_id_filter = request.query_params.get("session_id")
        date_from = request.query_params.get("date_from")
        date_to = request.query_params.get("date_to")

        if search:
            qs = qs.filter(Q(session_id__icontains=search) | Q(visitor_id__icontains=search))
        if session_id_filter:
            qs = qs.filter(session_id=session_id_filter)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        # Stats computed before risk filter so numbers always reflect full set
        base_qs = qs
        stats = {
            "total": base_qs.count(),
            "high": base_qs.filter(max_score__gt=0.75).count(),
            "medium": base_qs.filter(max_score__gt=0.5, max_score__lte=0.75).count(),
            "low": base_qs.filter(max_score__lte=0.5).count(),
        }

        risk_filter = request.query_params.get("risk")
        if risk_filter == "high":
            qs = qs.filter(max_score__gt=0.75)
        elif risk_filter == "medium":
            qs = qs.filter(max_score__gt=0.5, max_score__lte=0.75)
        elif risk_filter == "low":
            qs = qs.filter(max_score__lte=0.5)

        paginator = _std_paginator(request)
        page = paginator.paginate_queryset(qs, request)

        device_map = {
            s.session_id: s.device_type
            for s in Session.objects.filter(session_id__in=[d.session_id for d in page])
        }

        results = [_diagnosis_row(d, device_map) for d in page]
        response = paginator.get_paginated_response(results)
        response.data["stats"] = stats
        return response


class DiagnosisDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        diagnosis = (
            Diagnosis.objects.filter(id=pk, tenant=tenant)
            .select_related("recommendation")
            .annotate(max_score=Greatest(
                "score_s1", "score_s2", "score_s3", "score_s4",
                "score_s5", "score_s6", "score_s7",
            ))
            .first()
        )
        if not diagnosis:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        data = _diagnosis_row(diagnosis)
        data["visitor_id"] = diagnosis.visitor_id
        data["tier"] = diagnosis.tier
        data["status"] = diagnosis.status
        return Response(data)


# ---------------------------------------------------------------------------
# Tenant list + detail  (admin only)
# ---------------------------------------------------------------------------

def _owner_email(tenant) -> str | None:
    member = (
        TeamMember.objects.select_related("user")
        .filter(tenant=tenant, role=TeamMember.Role.OWNER)
        .first()
    )
    return member.user.email if member else None


class TenantListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        qs = Tenant.objects.all().order_by("-created_at")

        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(domain__icontains=search))
        if status_filter:
            qs = qs.filter(status=status_filter)

        now = timezone.now()
        summary = {
            "total": Tenant.objects.count(),
            "active": Tenant.objects.filter(status=Tenant.Status.ACTIVE).count(),
            "new_30d": Tenant.objects.filter(created_at__gte=now - timedelta(days=30)).count(),
        }

        paginator = _std_paginator(request)
        page = paginator.paginate_queryset(qs, request)

        page_ids = [t.id for t in page]
        annotated = Tenant.objects.filter(id__in=page_ids).annotate(
            pred_count=Count("prediction_results", distinct=True),
            abandoned_count=Count(
                "prediction_results",
                filter=Q(prediction_results__business_outcome__in=["abandoned", "abandon"])
                | Q(
                    prediction_results__business_outcome="unknown",
                    prediction_results__predicted_class__in=["abandoned", "abandon"],
                ),
                distinct=True,
            ),
            session_count=Count("sessions", distinct=True),
        )
        tenant_map = {t.id: t for t in annotated}
        owner_map = {
            m.tenant_id: m.user.email
            for m in TeamMember.objects.select_related("user").filter(
                tenant_id__in=page_ids,
                role=TeamMember.Role.OWNER,
            )
        }

        def _row(t):
            annotated_tenant = tenant_map[t.id]
            pred_count = annotated_tenant.pred_count
            abandoned = annotated_tenant.abandoned_count
            return {
                "id": t.id,
                "name": t.name,
                "email": owner_map.get(t.id),
                "plan": t.tier,
                "status": t.status,
                "created_at": t.created_at,
                "total_sessions": annotated_tenant.session_count,
                "abandonment_rate": round(abandoned / pred_count, 4) if pred_count else 0.0,
            }

        response = paginator.get_paginated_response([_row(t) for t in page])
        response.data["summary"] = summary
        return response


class TenantDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int):
        if not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        tenant = Tenant.objects.filter(id=pk).first()
        if not tenant:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        pred_count = PredictionResult.objects.filter(tenant=tenant).count()
        abandoned = _abandoned_prediction_count(PredictionResult.objects.filter(tenant=tenant))

        return Response({
            "id": tenant.id,
            "name": tenant.name,
            "plan": tenant.tier,
            "status": tenant.status,
            "created_at": tenant.created_at,
            "owner_email": _owner_email(tenant),
            "total_sessions": Session.objects.filter(tenant=tenant).count(),
            "total_predictions": pred_count,
            "abandonment_rate": round(abandoned / pred_count, 4) if pred_count else 0.0,
            "api_keys": [
                {
                    "id": k.id,
                    "name": k.name,
                    "key_masked": k.prefix + "***",
                    "is_active": k.is_active,
                    "tier": k.tier,
                }
                for k in APIKey.objects.filter(tenant=tenant).order_by("-created_at")
            ],
        })


# ---------------------------------------------------------------------------
# Settings — API keys
# ---------------------------------------------------------------------------

_TIER_MAP = {"T1": "basic", "T2": "smart", "T3": "full"}


class ApiKeyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        keys = APIKey.objects.filter(tenant=tenant).order_by("-created_at")
        return Response([
            {
                "id": k.id,
                "name": k.name,
                "key_masked": k.prefix + "***",
                "is_active": k.is_active,
                "tier": k.tier,
                "created_at": k.created_at,
            }
            for k in keys
        ])

    def post(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        name = request.data.get("name", "")
        tier_input = request.data.get("tier", "basic")
        tier = _TIER_MAP.get(tier_input, tier_input)

        if tier not in ("basic", "smart", "full"):
            return Response({"tier": ["Буруу tier: basic/smart/full эсвэл T1/T2/T3 ашиглана уу"]},
                            status=status.HTTP_400_BAD_REQUEST)

        raw_key, key_hash = APIKey.generate_raw_key(tier=tier)
        api_key = APIKey.objects.create(
            tenant=tenant,
            key_hash=key_hash,
            prefix=APIKey._prefix_for_tier(tier),
            tier=tier,
            name=name,
            is_active=True,
            last_shown_at=timezone.now(),
        )
        observer_url = os.getenv("OBSERVER_PUBLIC_URL", "http://localhost:8001")
        observer_install_snippet = (
            f'<script src="{observer_url}/static/snippet/track.js?key={raw_key}" '
            f'data-tenant-id="{tenant.external_id}" data-tier="{api_key.tier}" async></script>'
        )
        return Response({
            "id": api_key.id,
            "name": api_key.name,
            "key": raw_key,
            "key_plain": raw_key,
            "key_masked": api_key.prefix + "***",
            "tier": api_key.tier,
            "is_active": api_key.is_active,
            "created_at": api_key.created_at,
            "tenant_external_id": str(tenant.external_id),
            "observer_install_snippet": observer_install_snippet,
        }, status=status.HTTP_201_CREATED)


class ApiKeyDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk: int):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        key = APIKey.objects.filter(id=pk, tenant=tenant).first()
        if not key:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        key.is_active = False
        key.save(update_fields=["is_active"])
        return Response(status=status.HTTP_204_NO_CONTENT)


# ---------------------------------------------------------------------------
# Settings — store
# ---------------------------------------------------------------------------

class StoreSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def _serialize(self, tenant):
        return {
            "id": tenant.id,
            "name": tenant.name,
            "plan": tenant.tier,
            "domain": tenant.domain,
            "timezone": tenant.timezone,
            "created_at": tenant.created_at,
        }

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
        return Response(self._serialize(tenant))

    def patch(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        is_owner_or_admin = TeamMember.objects.filter(
            user=request.user, tenant=tenant,
            role__in=[TeamMember.Role.OWNER, TeamMember.Role.ADMIN],
        ).exists()
        if not is_owner_or_admin:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = StoreSettingsSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        update_fields = []
        for field in ("name", "domain", "timezone"):
            if field in serializer.validated_data:
                setattr(tenant, field, serializer.validated_data[field])
                update_fields.append(field)
        if update_fields:
            tenant.save(update_fields=update_fields)

        return Response(self._serialize(tenant))


# ---------------------------------------------------------------------------
# Settings — team
# ---------------------------------------------------------------------------

class SettingsTeamListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        members = (
            TeamMember.objects.select_related("user")
            .filter(tenant=tenant)
            .order_by("created_at")
        )
        return Response([
            {
                "id": m.id,
                "email": m.user.email,
                "full_name": f"{m.user.first_name} {m.user.last_name}".strip(),
                "role": m.role,
                "joined_at": m.created_at,
                "is_active": m.user.is_active,
            }
            for m in members
        ])


class SettingsTeamInviteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        is_owner = TeamMember.objects.filter(
            user=request.user, tenant=tenant, role=TeamMember.Role.OWNER
        ).exists()
        if not is_owner:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get("email", "").strip()
        role = request.data.get("role", TeamMember.Role.MEMBER)

        if not email:
            return Response({"email": ["Энэ талбар шаардлагатай"]}, status=status.HTTP_400_BAD_REQUEST)

        valid_roles = [r.value for r in TeamMember.Role]
        if role not in valid_roles:
            return Response({"role": [f"Буруу role. Сонголтууд: {', '.join(valid_roles)}"]},
                            status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            base = email.split("@")[0] or "user"
            username, counter = base, 1
            while User.objects.filter(username=username).exists():
                username = f"{base}{counter}"
                counter += 1
            user = User.objects.create(username=username, email=email, is_active=True)
            user.set_unusable_password()
            user.save(update_fields=["password"])

        tm, created = TeamMember.objects.get_or_create(
            tenant=tenant, user=user, defaults={"role": role}
        )
        if not created and tm.role != role:
            tm.role = role
            tm.save(update_fields=["role"])

        return Response({"message": "Урилга илгээгдлээ"}, status=status.HTTP_201_CREATED)


class SettingsTeamDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk: int):
        tenant = resolve_tenant_for_user(request)
        if not tenant:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        is_owner_or_admin = TeamMember.objects.filter(
            user=request.user, tenant=tenant,
            role__in=[TeamMember.Role.OWNER, TeamMember.Role.ADMIN],
        ).exists()
        if not is_owner_or_admin:
            return Response({"detail": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        member = TeamMember.objects.filter(id=pk, tenant=tenant).first()
        if not member:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        if member.user_id == request.user.id:
            return Response({"detail": "Өөрийгөө устгах боломжгүй"}, status=status.HTTP_400_BAD_REQUEST)

        if member.role == TeamMember.Role.OWNER:
            owner_count = TeamMember.objects.filter(tenant=tenant, role=TeamMember.Role.OWNER).count()
            if owner_count <= 1:
                return Response({"detail": "Сүүлчийн эзэмшигчийг устгах боломжгүй"},
                                status=status.HTTP_400_BAD_REQUEST)

        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
