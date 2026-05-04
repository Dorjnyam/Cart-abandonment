from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from typing import Any

import asyncpg

from app.config import PG_DSN
from app.telemetry import record_event

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None
_pool_lock = asyncio.Lock()


_DDL = """
CREATE SCHEMA IF NOT EXISTS sessions;
CREATE TABLE IF NOT EXISTS sessions.sessions (
    session_id uuid PRIMARY KEY,
    visitor_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    started_at timestamptz NOT NULL,
    ended_at timestamptz NOT NULL,
    event_count integer NOT NULL DEFAULT 0,
    page_views integer NOT NULL DEFAULT 0,
    session_duration_sec integer NOT NULL DEFAULT 0,
    duration_ms bigint GENERATED ALWAYS AS (session_duration_sec::bigint * 1000) STORED,
    state text,
    device_type text,
    is_completed_purchase boolean NOT NULL DEFAULT false,
    abandoned boolean NOT NULL DEFAULT false,
    end_reason text,
    raw_session_payload jsonb NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_visitor_id_idx ON sessions.sessions (visitor_id);
CREATE INDEX IF NOT EXISTS sessions_started_at_idx ON sessions.sessions (started_at);
CREATE INDEX IF NOT EXISTS sessions_tenant_id_idx ON sessions.sessions (tenant_id);
CREATE INDEX IF NOT EXISTS sessions_state_idx ON sessions.sessions (state);
"""


async def _ensure_schema(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(_DDL)


async def get_pool() -> asyncpg.Pool:
    global _pool
    async with _pool_lock:
        if _pool is None:
            _pool = await asyncpg.create_pool(
                PG_DSN,
                min_size=2,
                max_size=10,
                max_inactive_connection_lifetime=300.0,
                command_timeout=30.0,
            )
            await _ensure_schema(_pool)
    return _pool


async def close_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


async def write_session_to_pg(session_data: dict[str, Any]) -> None:
    from app.metrics import db_write_errors

    started = datetime.fromisoformat(session_data["started_at"])
    ended = datetime.fromisoformat(
        session_data.get("last_seen_at", session_data["started_at"])
    )
    state = session_data.get("state", "ACTIVE")
    is_purchase = session_data.get("is_completed_purchase") == "true"
    end_reason = session_data.get("end_reason", "timeout")

    for attempt in range(3):
        try:
            pool = await get_pool()
            await pool.execute(
                """
                INSERT INTO sessions.sessions (
                    session_id, visitor_id, tenant_id,
                    started_at, ended_at, event_count, page_views,
                    session_duration_sec, state, device_type,
                    is_completed_purchase, abandoned, end_reason,
                    raw_session_payload
                ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                ON CONFLICT (session_id) DO UPDATE
                SET
                    ended_at = EXCLUDED.ended_at,
                    event_count = EXCLUDED.event_count,
                    page_views = EXCLUDED.page_views,
                    session_duration_sec = EXCLUDED.session_duration_sec,
                    state = EXCLUDED.state,
                    is_completed_purchase = EXCLUDED.is_completed_purchase,
                    abandoned = EXCLUDED.abandoned,
                    end_reason = EXCLUDED.end_reason,
                    raw_session_payload = EXCLUDED.raw_session_payload
                """,
                session_data["session_id"],
                session_data["visitor_id"],
                session_data["tenant_id"],
                started,
                ended,
                int(session_data.get("event_count", 0)),
                int(session_data.get("page_view_count", session_data.get("page_views", 0))),
                max(0, int((ended - started).total_seconds())),
                state,
                session_data.get("device_type", "unknown"),
                is_purchase,
                state == "ABANDONED",
                end_reason,
                json.dumps(session_data),
            )
            record_event(
                "pg_written",
                {
                    "session_id": session_data["session_id"],
                    "event_count": int(session_data.get("event_count", 0)),
                },
            )
            return
        except (asyncpg.PostgresConnectionError, OSError) as exc:
            db_write_errors.inc()
            if attempt == 2:
                logger.error(
                    "write_session_to_pg failed after 3 attempts session=%s: %s",
                    session_data.get("session_id"), exc,
                )
                raise
            logger.warning(
                "write_session_to_pg attempt %d failed, retrying: %s", attempt + 1, exc
            )
            await asyncio.sleep(2 ** attempt)
        except Exception as exc:
            db_write_errors.inc()
            logger.error(
                "write_session_to_pg non-retryable error session=%s: %s",
                session_data.get("session_id"), exc,
            )
            raise
