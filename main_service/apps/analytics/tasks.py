from __future__ import annotations

import hashlib
import io
import json
import logging
import os
import tempfile
from datetime import date, datetime
from typing import Any, Dict

import boto3
import duckdb
import redis
from celery import shared_task
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.analytics.duckdb_client import ensure_analytics_schema, writer_connection
from apps.analytics.gemini_client import generate_recommendation
from apps.analytics.models import Diagnosis, PredictionResult, ProcessedSession, Recommendation, Session
from apps.analytics.observer_db import fetch_session_events, resolve_tenant_for_session
from apps.analytics.prediction_pipeline import handle_prediction_payload
from apps.analytics.scoring import compute_all_scores
from apps.tenants.models import Tenant

logger = logging.getLogger(__name__)

CA_DIAGNOSIS_QUEUE = "ca:diagnosis:queue"


def _backoff_kwargs(retries: int) -> Dict[str, Any]:
    return {"countdown": 2 ** max(retries, 0)}


def aggregate_session_to_duckdb(
    *,
    session_id: str,
    tenant_id: int,
    prediction_score: float,
    predicted_class: str,
    shap_values: dict,
    model_variant: str = "baseline",
    abandonment_probability: float | None = None,
    confidence: float | None = None,
    model_version: str | None = None,
    visitor_id: str | None = None,
) -> None:
    """Upsert one prediction row into DuckDB (delete-then-insert for idempotency)."""
    with writer_connection() as con:
        ensure_analytics_schema(con)
        con.execute(
            "DELETE FROM predictions WHERE tenant_id = ? AND session_id = ?",
            (tenant_id, session_id),
        )
        con.execute(
            """
            INSERT INTO predictions (
                tenant_id, session_id, visitor_id, model_variant,
                predicted_class, prediction_score, abandonment_probability,
                confidence, model_version, shap_values, predicted_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                tenant_id,
                session_id,
                visitor_id,
                model_variant,
                predicted_class,
                prediction_score,
                abandonment_probability,
                confidence,
                model_version,
                json.dumps(shap_values),
                timezone.now(),
                timezone.now(),
            ),
        )


@shared_task(bind=True, max_retries=3)
def consume_ca_diagnosis_queue_once(self):
    """
    WF-03: Pop up to 10 messages from ca:diagnosis:queue, run full scoring
    pipeline (S1-S7 → Gemini → Diagnosis + Recommendation), then mark processed.
    """
    r = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    batch_size = 10
    processed = 0

    for _ in range(batch_size):
        item = r.lpop(CA_DIAGNOSIS_QUEUE)
        if item is None:
            break
        try:
            data = json.loads(item)
            session_id = data.get("session_id")
            visitor_id = data.get("visitor_id") or "unknown"
            tenant_id = data.get("tenant_id")
            tier = data.get("tier", "T2")

            if not session_id:
                continue

            if ProcessedSession.objects.filter(observer_session_id=session_id).exists():
                continue

            events = fetch_session_events(session_id)
            if not events:
                logger.warning("consume_ca_diagnosis_queue: no events for %s", session_id)
                continue

            scores = compute_all_scores(events)

            # Resolve tenant
            tenant = None
            if tenant_id:
                tenant = Tenant.objects.filter(id=tenant_id, status=Tenant.Status.ACTIVE).first()
            if tenant is None:
                tenant = resolve_tenant_for_session(tier, visitor_id)
            if tenant is None:
                logger.warning("consume_ca_diagnosis_queue: no tenant for session %s", session_id)
                continue

            with transaction.atomic():
                session_obj, _ = Session.objects.get_or_create(
                    session_id=session_id,
                    defaults={
                        "visitor_id": visitor_id,
                        "tenant": tenant,
                        "event_count": len(events),
                        "started_at": timezone.now(),
                    },
                )

                diagnosis, _ = Diagnosis.objects.update_or_create(
                    session_id=session_id,
                    tenant=tenant,
                    defaults={
                        "visitor_id": visitor_id,
                        "tier": tenant.tier,
                        "score_s1": scores["s1"],
                        "score_s2": scores["s2"],
                        "score_s3": scores["s3"],
                        "score_s4": scores["s4"],
                        "score_s5": scores["s5"],
                        "score_s6": scores["s6"],
                        "score_s7": scores["s7"],
                        "status": Diagnosis.Status.CREATED,
                    },
                )

                rec_text = generate_recommendation(scores, {"session_id": session_id})
                dominant_score = scores.get("dominant_score", 0.0)

                Recommendation.objects.update_or_create(
                    diagnosis=diagnosis,
                    defaults={
                        "tenant": tenant,
                        "text_mn": rec_text,
                        "dominant_score": dominant_score,
                        "status": Recommendation.Status.CREATED,
                    },
                )

                ProcessedSession.objects.get_or_create(
                    observer_session_id=session_id,
                    defaults={
                        "visitor_id": visitor_id,
                        "tenant": tenant,
                        "tier": tenant.tier,
                    },
                )

            processed += 1
        except Exception as exc:
            logger.error("consume_ca_diagnosis_queue: error on %s: %s", item, exc, exc_info=True)
            r.rpush(CA_DIAGNOSIS_QUEUE, item)
            break

    return {"status": "ok", "processed": processed}


@shared_task(bind=True, max_retries=3)
def process_prediction(
    self,
    *,
    session_id: str,
    tenant_id: int,
    prediction_score: float,
    predicted_class: str,
    shap_values: dict | None = None,
    model_variant: str = "baseline",
    abandonment_probability: float | None = None,
    confidence: float | None = None,
    model_version: str | None = None,
    predicted_at: str | None = None,
    visitor_id: str | None = None,
    predicted_label: int | None = None,
    model_name: str = "xgboost",
    threshold: float | None = None,
    top_features: list | None = None,
    features: dict | None = None,
    created_at: str | None = None,
) -> Dict[str, Any]:
    """Persist prediction and create/update S1-S7 diagnosis + recommendation."""

    try:
        shap_values = shap_values or {}
        payload = {
            "session_id": session_id,
            "tenant_id": tenant_id,
            "visitor_id": visitor_id,
            "prediction_score": prediction_score,
            "abandonment_probability": abandonment_probability if abandonment_probability is not None else prediction_score,
            "predicted_class": predicted_class,
            "predicted_label": predicted_label,
            "shap_values": shap_values,
            "model_variant": model_variant,
            "model_name": model_name,
            "model_version": model_version,
            "threshold": threshold,
            "top_features": top_features or [],
            "features": features or {},
            "created_at": created_at or predicted_at,
        }
        result = handle_prediction_payload(payload)
        duckdb_tenant_id = result.get("tenant_id", tenant_id)

        aggregate_session_to_duckdb(
            session_id=session_id,
            tenant_id=duckdb_tenant_id,
            prediction_score=prediction_score,
            predicted_class=predicted_class,
            shap_values=shap_values,
            model_variant=model_variant,
            abandonment_probability=abandonment_probability,
            confidence=confidence,
            model_version=model_version,
            visitor_id=visitor_id,
        )
        return result
    except Tenant.DoesNotExist as exc:
        logger.error("Tenant not found for process_prediction(tenant_id=%s): %s", tenant_id, exc)
        raise
    except Exception as exc:
        logger.error(
            "process_prediction failed (session_id=%s tenant_id=%s attempt=%d/%d): %s",
            session_id,
            tenant_id,
            self.request.retries + 1,
            self.max_retries + 1,
            exc,
            exc_info=True,
        )
        raise self.retry(exc=exc, **_backoff_kwargs(self.request.retries))


@shared_task(bind=True, max_retries=3)
def export_to_minio(
    self,
    *,
    export_type: str = "analytics",
    model_variant: str | None = None,
    tenant_id: int | None = None,
) -> Dict[str, Any]:
    """
    Export a DuckDB query to MinIO as a Parquet file with partitioned key and idempotency check.
    """

    try:
        con = duckdb.connect(settings.DUCKDB_PATH, read_only=True)
        temp_path = None
        try:
            if export_type == "sessions":
                query = "SELECT * FROM sessions_summary"
                params = ()
            else:
                query = "SELECT * FROM predictions"
                params = ()
                if model_variant:
                    query += " WHERE model_variant = ?"
                    params = (model_variant,)

            with tempfile.NamedTemporaryFile(suffix=".parquet", delete=False) as temp_file:
                temp_path = temp_file.name
            con.execute(f"COPY ({query}) TO '{temp_path}' (FORMAT PARQUET)", params)
            with open(temp_path, "rb") as exported:
                payload = exported.read()
        finally:
            con.close()
            if temp_path and os.path.exists(temp_path):
                os.remove(temp_path)

        today = date.today().isoformat()
        variant_part = f"variant={model_variant}/" if model_variant else "variant=all/"
        key = f"predictions/{variant_part}date={today}/{export_type}.parquet"

        protocol = "https" if settings.MINIO_USE_SSL else "http"
        client = boto3.client(
            "s3",
            endpoint_url=f"{protocol}://{settings.MINIO_ENDPOINT}",
            aws_access_key_id=settings.MINIO_ACCESS_KEY,
            aws_secret_access_key=settings.MINIO_SECRET_KEY,
        )

        content_hash = hashlib.sha256(payload).hexdigest()
        try:
            existing = client.head_object(Bucket=settings.MINIO_BUCKET, Key=key)
            stored_hash = existing.get("Metadata", {}).get("content-hash")
            if stored_hash == content_hash:
                return {"status": "already_exists", "key": key}
        except Exception:
            pass  # Object doesn't exist yet

        client.put_object(
            Bucket=settings.MINIO_BUCKET,
            Key=key,
            Body=io.BytesIO(payload),
            Metadata={"content-hash": content_hash},
        )
        return {"status": "ok", "key": key}
    except Exception as exc:
        logger.exception("export_to_minio failed; retrying: %s", exc)
        raise self.retry(exc=exc, **_backoff_kwargs(self.request.retries))
