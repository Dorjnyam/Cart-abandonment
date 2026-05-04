import logging
from datetime import timedelta

from celery import shared_task
from django.db import connections
from django.utils import timezone

from apps.analytics.models import Diagnosis, ProcessedSession, Recommendation, Session
from apps.analytics.observer_db import fetch_unprocessed_sessions, resolve_tenant_for_session
from apps.tenants.models import Tenant

logger = logging.getLogger(__name__)


@shared_task
def process_session(session_id: str, tenant_id: int, tier: str | None = None):
    """
    WF-03/04 core processing pipeline.

    Idempotency: if `ProcessedSession(observer_session_id=session_id)` exists, we skip.
    Actual feature/score/gemini logic is implemented in WF-05–WF-07 modules.
    """
    if ProcessedSession.objects.filter(observer_session_id=session_id).exists():
        return {'status': 'skip'}

    tenant = Tenant.objects.get(id=tenant_id)
    resolved_tier = tier or tenant.tier

    # Get visitor_id (best-effort) from observer raw_events.
    visitor_id = 'unknown'
    try:
        with connections['observer'].cursor() as cursor:
            cursor.execute(
                """
                SELECT visitor_id
                FROM raw_events
                WHERE session_id = %s
                LIMIT 1
                """,
                [session_id],
            )
            row = cursor.fetchone()
            if row and row[0]:
                visitor_id = row[0]
    except Exception:
        # Observer schema / DB might not be available in dev yet.
        visitor_id = 'unknown'

    # Import inside task so WF-05..WF-07 can be developed independently.
    from apps.diagnosis.feature import extract_features_for_session
    from apps.diagnosis.scoring import score_s1_s7
    from apps.diagnosis.gemini import generate_recommendation_mn

    features = extract_features_for_session(session_id=session_id, tenant_id=tenant_id, tier=resolved_tier)
    scores = score_s1_s7(features, session_id=session_id)
    # `scores` expected shape: { s1..s7, dominant_score, vg_entropy, vg_motifs }
    dominant_score = scores['dominant_score']

    diagnosis = Diagnosis.objects.create(
        tenant=tenant,
        session_id=session_id,
        visitor_id=visitor_id,
        tier=resolved_tier,
        score_s1=scores['s1'],
        score_s2=scores['s2'],
        score_s3=scores['s3'],
        score_s4=scores['s4'],
        score_s5=scores['s5'],
        score_s6=scores['s6'],
        score_s7=scores['s7'],
        vg_entropy=scores.get('vg_entropy'),
        vg_motifs=scores.get('vg_motifs'),
        status=Diagnosis.Status.CREATED,
    )

    text_mn = generate_recommendation_mn(diagnosis=diagnosis, features=features, scores=scores, tenant=tenant)
    recommendation = Recommendation.objects.create(
        diagnosis=diagnosis,
        tenant=tenant,
        text_mn=text_mn,
        dominant_score=dominant_score,
        status=Recommendation.Status.CREATED,
    )

    ProcessedSession.objects.create(
        observer_session_id=session_id,
        visitor_id=visitor_id,
        tenant=tenant,
        tier=resolved_tier,
    )

    return {'status': 'processed', 'diagnosis_id': diagnosis.id, 'recommendation_id': recommendation.id}


@shared_task(bind=True, max_retries=3)
def poll_unprocessed_sessions(self):
    """
    WF-04 (DB mode): every 30s scan Observer DB raw_events, sync unprocessed
    sessions into the local Session model, then enqueue process_session.
    """
    since = timezone.now() - timedelta(hours=2)
    sessions = fetch_unprocessed_sessions(since, limit=200)

    queued = 0
    for s in sessions:
        try:
            tenant = resolve_tenant_for_session(s["tier"], s["visitor_id"])
            if tenant is None:
                continue

            session_obj, created = Session.objects.get_or_create(
                session_id=s["session_id"],
                defaults={
                    "visitor_id": s["visitor_id"],
                    "tenant": tenant,
                    "event_count": s["event_count"],
                    "started_at": s["started_at"] or timezone.now(),
                    "ended_at": s["last_event_at"],
                },
            )
            if not created:
                session_obj.event_count = s["event_count"]
                session_obj.ended_at = s["last_event_at"]
                session_obj.save(update_fields=["event_count", "ended_at"])

            ProcessedSession.objects.get_or_create(
                observer_session_id=s["session_id"],
                defaults={
                    "visitor_id": s["visitor_id"],
                    "tenant": tenant,
                    "tier": tenant.tier,
                },
            )

            process_session.delay(
                session_id=s["session_id"],
                tenant_id=tenant.id,
                tier=s["tier"],
            )
            queued += 1
        except Exception as exc:
            logger.error(
                "poll_unprocessed_sessions: error processing session %s: %s",
                s.get("session_id"),
                exc,
                exc_info=True,
            )

    return {"status": "queued", "count": queued}

