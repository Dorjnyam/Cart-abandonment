"""
Read-only access to Observer PostgreSQL (raw_events).

Copy into Main Service; set OBSERVER_DATABASE_URL.
"""

from __future__ import annotations

import json
from typing import Any

import asyncpg


async def fetch_session_events(
    pool: asyncpg.Pool, session_id: str
) -> list[dict[str, Any]]:
    """All events for a session, ascending by id."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, visitor_id, session_id, event_type, url, referrer,
                   timestamp, ip, user_agent, payload, tier, created_at
            FROM raw_events
            WHERE session_id = $1
            ORDER BY id ASC
            """,
            session_id,
        )
    return [_row_to_dict(r) for r in rows]


def _row_to_dict(r: asyncpg.Record) -> dict[str, Any]:
    d = dict(r)
    p = d.get("payload")
    if isinstance(p, str):
        try:
            d["payload"] = json.loads(p)
        except Exception:
            pass
    if d.get("created_at") is not None and hasattr(d["created_at"], "isoformat"):
        d["created_at"] = d["created_at"].isoformat()
    return d


async def list_sessions_with_session_end(
    pool: asyncpg.Pool, *, hours: int = 24, limit: int = 100
) -> list[dict[str, Any]]:
    """
    Sessions that have at least one session_end in the time window.
    One row per session: latest raw_events row for that session (for visitor_id, tier).
    """
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            WITH ended AS (
                SELECT DISTINCT session_id
                FROM raw_events
                WHERE event_type = 'session_end'
                  AND created_at > NOW() - ($1::int * interval '1 hour')
            )
            SELECT DISTINCT ON (r.session_id)
                r.session_id,
                r.visitor_id,
                r.tier
            FROM raw_events r
            INNER JOIN ended e ON e.session_id = r.session_id
            WHERE r.created_at > NOW() - ($1::int * interval '1 hour')
            ORDER BY r.session_id, r.id DESC
            LIMIT $2
            """,
            hours,
            limit,
        )
    return [dict(r) for r in rows]
