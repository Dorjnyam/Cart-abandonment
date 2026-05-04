from __future__ import annotations

import logging
from datetime import datetime

from django.db import connections

from apps.analytics.models import ProcessedSession
from apps.tenants.models import APIKey, Tenant

logger = logging.getLogger(__name__)


def fetch_unprocessed_sessions(since: datetime, limit: int = 500) -> list[dict]:
    """
    Query Observer DB raw_events grouped by session, excluding already-processed ones.
    Cross-DB SQL JOIN isn't possible, so processed IDs are filtered in Python.
    """
    processed_ids: set[str] = set(
        ProcessedSession.objects.values_list("observer_session_id", flat=True)
    )

    try:
        with connections["observer"].cursor() as cursor:
            cursor.execute(
                """
                SELECT session_id,
                       visitor_id,
                       tier,
                       COUNT(*)                              AS event_count,
                       MIN(created_at)                      AS started_at,
                       MAX(created_at)                      AS last_event_at,
                       JSONB_AGG(payload ORDER BY created_at) AS events
                FROM   raw_events
                WHERE  created_at > %s
                GROUP  BY session_id, visitor_id, tier
                ORDER  BY MAX(created_at) DESC
                LIMIT  %s
                """,
                [since, limit],
            )
            cols = [d[0] for d in cursor.description]
            rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
    except Exception as exc:
        logger.warning("fetch_unprocessed_sessions: observer DB query failed: %s", exc)
        return []

    return [r for r in rows if r["session_id"] not in processed_ids]


def fetch_session_events(session_id: str) -> list[dict]:
    """
    Fetch all raw_events for a session from Observer DB, ordered by created_at.
    Each returned dict has payload fields merged in plus 'event_type' and '_created_at'.
    Returns [] if the observer DB is unavailable or the session has no events.
    """
    try:
        with connections["observer"].cursor() as cursor:
            cursor.execute(
                """
                SELECT payload, event_type, created_at
                FROM   raw_events
                WHERE  session_id = %s
                ORDER  BY created_at ASC
                """,
                [session_id],
            )
            rows = cursor.fetchall()
    except Exception as exc:
        logger.warning("fetch_session_events: observer query failed: %s", exc)
        return []

    result = []
    for payload, event_type, created_at in rows:
        entry: dict = payload if isinstance(payload, dict) else {}
        entry["event_type"] = event_type
        entry["_created_at"] = created_at.isoformat() if hasattr(created_at, "isoformat") else str(created_at)
        result.append(entry)
    return result


def resolve_tenant_for_session(tier: str, visitor_id: str) -> Tenant | None:
    """
    Map Observer tier (T1/T2/T3) → Django APIKey tier → Tenant.
    Falls back to the first active Tenant if no APIKey matches.
    """
    tier_map = {"T1": "full", "T2": "smart", "T3": "basic"}
    django_tier = tier_map.get(tier, "basic")

    apikey = (
        APIKey.objects.filter(tier=django_tier, is_active=True)
        .select_related("tenant")
        .first()
    )
    if apikey:
        return apikey.tenant

    fallback = Tenant.objects.filter(status=Tenant.Status.ACTIVE).first()
    if not fallback:
        logger.warning(
            "resolve_tenant_for_session: no active tenant found (tier=%s visitor=%s)",
            tier,
            visitor_id,
        )
    return fallback
