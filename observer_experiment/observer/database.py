"""
PostgreSQL connection using asyncpg — Observer package copy with optional ``tier`` column.
"""
import asyncio
import asyncpg
import json
import logging
from datetime import datetime

from observer.config import settings

logger = logging.getLogger(__name__)

DATABASE_URL = settings.database_url

_pool = None
_pool_lock: asyncio.Lock | None = None


def _get_pool_lock() -> asyncio.Lock:
    global _pool_lock
    if _pool_lock is None:
        _pool_lock = asyncio.Lock()
    return _pool_lock


async def get_pool():
    global _pool
    if _pool is not None:
        return _pool
    async with _get_pool_lock():
        if _pool is not None:
            return _pool
        for attempt in range(1, 6):
            try:
                _pool = await asyncpg.create_pool(
                    DATABASE_URL,
                    min_size=settings.db_pool_min_size,
                    max_size=settings.db_pool_max_size,
                    max_inactive_connection_lifetime=settings.db_pool_max_inactive_lifetime,
                )
                break
            except Exception as exc:
                if attempt == 5:
                    raise
                wait = 2 ** attempt
                logger.warning(
                    "DB pool creation failed (attempt %s/5): %s — retrying in %ss",
                    attempt, exc, wait,
                )
                await asyncio.sleep(wait)
    return _pool


async def init_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS raw_events (
                id          BIGSERIAL PRIMARY KEY,
                event_id    TEXT,
                visitor_id  TEXT,
                session_id  TEXT,
                event_type  TEXT,
                url         TEXT,
                referrer    TEXT,
                timestamp   TEXT,
                ip          TEXT,
                user_agent  TEXT,
                payload     JSONB NOT NULL DEFAULT '{}',
                created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT raw_events_event_id_key UNIQUE (event_id)
            );

            CREATE INDEX IF NOT EXISTS idx_session
                ON raw_events (session_id);
            CREATE INDEX IF NOT EXISTS idx_visitor
                ON raw_events (visitor_id);
            CREATE INDEX IF NOT EXISTS idx_event_type
                ON raw_events (event_type);
            CREATE INDEX IF NOT EXISTS idx_created
                ON raw_events (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_payload_gin
                ON raw_events USING GIN (payload);
        """)
        await conn.execute(
            "ALTER TABLE raw_events ADD COLUMN IF NOT EXISTS tier TEXT;"
        )
        await conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_raw_events_tier ON raw_events (tier);"
        )
        # Add event_id column and unique constraint to existing tables that predate this migration.
        await conn.execute(
            "ALTER TABLE raw_events ADD COLUMN IF NOT EXISTS event_id TEXT;"
        )
        await conn.execute("""
            DO $$ BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint
                    WHERE conname = 'raw_events_event_id_key'
                ) THEN
                    ALTER TABLE raw_events
                        ADD CONSTRAINT raw_events_event_id_key UNIQUE (event_id);
                END IF;
            END $$;
        """)
    logger.info("Database initialized")


async def save_event(data: dict, tier: str | None = None) -> int:
    pool = await get_pool()

    core = {
        "visitor_id",
        "session_id",
        "event_type",
        "url",
        "referrer",
        "timestamp",
        "ip",
        "user_agent",
    }

    payload = {k: v for k, v in data.items() if k not in core}

    event_id = data.get("event_id") or None  # keep as NULL when absent so NULLs don't conflict

    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO raw_events
                (event_id, visitor_id, session_id, event_type, url,
                 referrer, timestamp, ip, user_agent, payload, tier)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
            ON CONFLICT (event_id) DO NOTHING
            RETURNING id
            """,
            event_id,
            data.get("visitor_id", ""),
            data.get("session_id", ""),
            data.get("event_type", "unknown"),
            data.get("url", ""),
            data.get("referrer", ""),
            data.get("timestamp", datetime.now().isoformat()),
            data.get("ip", ""),
            data.get("user_agent", ""),
            json.dumps(payload),
            tier,
        )
        return row["id"] if row else 0


async def get_events(limit=100, event_type=None, session_id=None):
    pool = await get_pool()

    query = "SELECT * FROM raw_events"
    params = []
    conditions = []

    if event_type:
        conditions.append(f"event_type = ${len(params)+1}")
        params.append(event_type)
    if session_id:
        conditions.append(f"session_id = ${len(params)+1}")
        params.append(session_id)

    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += f" ORDER BY id DESC LIMIT ${len(params)+1}"
    params.append(limit)

    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        result = []
        for r in rows:
            row = dict(r)
            if isinstance(row.get("payload"), str):
                try:
                    row["payload"] = json.loads(row["payload"])
                except Exception as exc:
                    logger.warning("get_events: payload JSON decode failed for id=%s: %s", row.get("id"), exc)
            if row.get("created_at"):
                row["created_at"] = row["created_at"].isoformat()
            result.append(row)
        return result


async def get_stats():
    pool = await get_pool()
    async with pool.acquire() as conn:
        total = await conn.fetchval("SELECT COUNT(*) FROM raw_events")
        sessions = await conn.fetchval("SELECT COUNT(DISTINCT session_id) FROM raw_events")
        visitors = await conn.fetchval("SELECT COUNT(DISTINCT visitor_id) FROM raw_events")

        type_rows = await conn.fetch("""
                SELECT event_type, COUNT(*) as cnt
                FROM raw_events
                GROUP BY event_type
                ORDER BY cnt DESC
            """)
        top_urls = await conn.fetch("""
                SELECT url, COUNT(*) as cnt
                FROM raw_events
                GROUP BY url
                ORDER BY cnt DESC
                LIMIT 10
            """)
        hourly = await conn.fetch("""
                SELECT
                    DATE_TRUNC('hour', created_at) as hour,
                    COUNT(*) as cnt
                FROM raw_events
                WHERE created_at > NOW() - INTERVAL '24 hours'
                GROUP BY hour
                ORDER BY hour
            """)

        return {
            "total_events": total,
            "unique_sessions": sessions,
            "unique_visitors": visitors,
            "event_types": {r["event_type"]: r["cnt"] for r in type_rows},
            "top_urls": [{"url": r["url"], "count": r["cnt"]} for r in top_urls],
            "hourly": [{"hour": r["hour"].isoformat(), "count": r["cnt"]} for r in hourly],
        }


async def get_session_detail(session_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT * FROM raw_events
            WHERE session_id = $1
            ORDER BY id ASC
            """,
            session_id,
        )

        result = []
        for r in rows:
            row = dict(r)
            if isinstance(row.get("payload"), str):
                try:
                    row["payload"] = json.loads(row["payload"])
                except Exception as exc:
                    logger.warning("get_session_detail: payload JSON decode failed for id=%s: %s", row.get("id"), exc)
            if row.get("created_at"):
                row["created_at"] = row["created_at"].isoformat()
            result.append(row)
        return result


async def get_field_analysis(limit=1000):
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                key,
                COUNT(*) as cnt,
                ROUND((COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM raw_events), 0))::numeric, 1) as pct
            FROM raw_events,
                 jsonb_object_keys(payload) as key
            GROUP BY key
            ORDER BY cnt DESC
            LIMIT 100
        """)
        total = await conn.fetchval("SELECT COUNT(*) FROM raw_events")

        return {
            "total_events_analyzed": total,
            "unique_fields_found": len(rows),
            "fields": [
                {"field": r["key"], "count": r["cnt"], "pct": float(r["pct"])}
                for r in rows
            ],
        }


async def clear_events():
    pool = await get_pool()
    async with pool.acquire() as conn:
        tag = await conn.execute("DELETE FROM raw_events")
        try:
            return int(tag.split()[-1])
        except (ValueError, IndexError):
            return 0
