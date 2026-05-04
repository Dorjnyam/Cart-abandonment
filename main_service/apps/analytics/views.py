from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from django.db.models.functions import Greatest
from django.utils import timezone
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.analytics.duckdb_client import get_duckdb_daily_trend
from apps.analytics.models import Diagnosis, PredictionResult, Recommendation, Session
from apps.analytics.serializers import ExportTriggerSerializer, StoreSettingsSerializer
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
        abandoned_count = PredictionResult.objects.filter(
            tenant=tenant, predicted_class__in=["abandoned", "abandon"]
        ).count()
        abandonment_rate = (abandoned_count / total_predictions) if total_predictions else 0.0
        avg_confidence = (
            PredictionResult.objects.filter(tenant=tenant).aggregate(v=Avg("confidence"))["v"] or 0.0
        )
        active_sessions = Session.objects.filter(tenant=tenant, ended_at__isnull=True).count()
        trend_7d = get_duckdb_daily_trend(tenant.id, days=7)

        return Response({
            "total_sessions": total_sessions,
            "total_predictions": total_predictions,
            "abandonment_rate": round(abandonment_rate, 4),
            "avg_confidence": round(float(avg_confidence), 4),
            "active_sessions": active_sessions,
            "trend_7d": trend_7d,
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
            qs = qs.filter(prediction__predicted_class=prediction_filter)

        paginator = _std_paginator(request)
        page = paginator.paginate_queryset(qs, request)

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
        return Response({
            "session_id": session.session_id,
            "visitor_id": session.visitor_id,
            "started_at": session.started_at,
            "ended_at": session.ended_at,
            "event_count": session.event_count,
            "page_views": session.page_views,
            "device_type": session.device_type,
            "prediction": _prediction_block(prediction),
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
        abandoned = qs.filter(predicted_class__in=["abandoned", "abandon"]).count()
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

        data = [
            {
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
            for item in page
        ]
        return paginator.get_paginated_response(data)


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
                checks["duckdb"] = "file_not_found"
                failed = True
        except Exception as e:
            checks["duckdb"] = f"failed: {e}"
            failed = True

        try:
            import redis as _redis
            r = _redis.Redis.from_url(settings.REDIS_URL)
            r.ping()
            checks["redis"] = "ok"
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
                results.append({"model_variant": variant, "count": 0})
                continue

            abandoned = qs.filter(predicted_class__in=["abandoned", "abandon"]).count()
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

        return Response({"variants": results, "comparison": comparison})


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
    return {
        "id": d.id,
        "session_id": d.session_id,
        "risk": _risk(max_s),
        "scores": {f"S{i}": float(getattr(d, f"score_s{i}")) for i in range(1, 8)},
        "dominant_score": round(max_s, 4),
        "prediction_score": round(max_s, 4),
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
                filter=Q(prediction_results__predicted_class__in=["abandoned", "abandon"]),
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
        abandoned = PredictionResult.objects.filter(
            tenant=tenant, predicted_class__in=["abandoned", "abandon"]
        ).count()

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
        return Response({
            "id": api_key.id,
            "name": api_key.name,
            "key": raw_key,
            "tier": api_key.tier,
            "created_at": api_key.created_at,
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
