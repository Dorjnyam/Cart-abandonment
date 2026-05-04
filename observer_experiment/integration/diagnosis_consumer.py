"""
Diagnosis consumer: Redis BRPOP on ca:diagnosis:queue, or DB polling fallback.

Run (from observer_experiment repo root, after env + schema on Main DB):
  python -m integration.diagnosis_consumer

Or copy this file + observer_db.py into your Main Service and run there.

Env:
  OBSERVER_DATABASE_URL  — Observer Postgres (read raw_events)
  MAIN_DATABASE_URL or DATABASE_URL — Main Service Postgres (processed_sessions)
  REDIS_URL              — optional; if missing or down, uses polling only
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from typing import Any

import asyncpg
import redis.asyncio as redis_async

# Repo: run ``python -m integration.diagnosis_consumer`` from project root.
# Flat copy: replace the line below with ``from observer_db import ...``.
from integration.observer_db import (
    fetch_session_events,
    list_sessions_with_session_end,
)

log = logging.getLogger(__name__)

DIAGNOSIS_QUEUE = "ca:diagnosis:queue"
BRPOP_TIMEOUT_SEC = 30
POLL_INTERVAL_SEC = 30


def _main_dsn() -> str:
    return (
        os.getenv("MAIN_DATABASE_URL", "").strip()
        or os.getenv("DATABASE_URL", "").strip()
    )


class DiagnosisConsumer:
    def __init__(self) -> None:
        self._observer_dsn = os.getenv("OBSERVER_DATABASE_URL", "").strip()
        self._main_dsn = _main_dsn()
        self._redis_url = os.getenv("REDIS_URL", "").strip()
        self._observer_pool: asyncpg.Pool | None = None
        self._main_pool: asyncpg.Pool | None = None

    async def _ensure_pools(self) -> None:
        if not self._observer_dsn:
            raise RuntimeError("OBSERVER_DATABASE_URL is required")
        if not self._main_dsn:
            raise RuntimeError("MAIN_DATABASE_URL or DATABASE_URL is required")
        if self._observer_pool is None:
            self._observer_pool = await asyncpg.create_pool(
                self._observer_dsn, min_size=1, max_size=5
            )
        if self._main_pool is None:
            self._main_pool = await asyncpg.create_pool(
                self._main_dsn, min_size=1, max_size=5
            )

    async def close(self) -> None:
        if self._observer_pool:
            await self._observer_pool.close()
            self._observer_pool = None
        if self._main_pool:
            await self._main_pool.close()
            self._main_pool = None

    async def _redis_client(self) -> redis_async.Redis | None:
        if not self._redis_url:
            return None
        try:
            r = redis_async.from_url(
                self._redis_url, decode_responses=True, socket_timeout=60.0
            )
            await r.ping()
            return r
        except Exception as e:
            log.warning("Redis unavailable (%s); using DB polling mode", e)
            return None

    async def is_processed(self, session_id: str) -> bool:
        assert self._main_pool is not None
        async with self._main_pool.acquire() as conn:
            v = await conn.fetchval(
                "SELECT 1 FROM processed_sessions WHERE observer_session_id = $1",
                session_id,
            )
            return v is not None

    async def mark_processed(
        self, session_id: str, visitor_id: str | None, tier: str | None
    ) -> None:
        assert self._main_pool is not None
        async with self._main_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO processed_sessions (observer_session_id, visitor_id, tier)
                VALUES ($1, $2, $3)
                ON CONFLICT (observer_session_id) DO NOTHING
                """,
                session_id,
                visitor_id,
                tier,
            )

    async def _process_session(
        self, session_id: str, visitor_id: str | None, tier: str | None
    ) -> None:
        await self._ensure_pools()
        assert self._observer_pool is not None
        assert self._main_pool is not None

        if await self.is_processed(session_id):
            log.debug("Skip already processed session %s", session_id)
            return

        events = await fetch_session_events(self._observer_pool, session_id)
        if not events:
            log.warning("No events for session %s", session_id)
            return

        # --- Replace with your pipeline: features → S1–S7 → Gemini → persist ---
        stub_payload = {
            "event_count": len(events),
            "tier": tier,
            "visitor_id": visitor_id,
        }
        log.info(
            "STUB diagnosis session=%s events=%s tier=%s",
            session_id,
            len(events),
            tier,
        )
        _ = stub_payload  # use in real insert

        async with self._main_pool.acquire() as conn:
            async with conn.transaction():
                await conn.execute(
                    """
                    INSERT INTO processed_sessions (observer_session_id, visitor_id, tier)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (observer_session_id) DO NOTHING
                    """,
                    session_id,
                    visitor_id,
                    tier,
                )

    async def _run_redis_mode(self, redis: redis_async.Redis) -> None:
        log.info("Diagnosis consumer: Redis mode (BRPOP %s)", DIAGNOSIS_QUEUE)
        try:
            while True:
                result = await redis.brpop(DIAGNOSIS_QUEUE, timeout=BRPOP_TIMEOUT_SEC)
                if result is None:
                    continue
                _, raw = result
                try:
                    item = json.loads(raw)
                except json.JSONDecodeError:
                    log.warning("Invalid JSON from queue: %s", raw[:200])
                    continue
                sid = item.get("session_id")
                vid = item.get("visitor_id")
                tier = item.get("tier")
                if not sid:
                    continue
                try:
                    await self._process_session(sid, vid, tier)
                except Exception:
                    log.exception("process_session failed session_id=%s", sid)
        finally:
            await redis.aclose()

    async def _run_db_mode(self) -> None:
        log.info("Diagnosis consumer: DB polling mode (every %ss)", POLL_INTERVAL_SEC)
        while True:
            await asyncio.sleep(POLL_INTERVAL_SEC)
            try:
                await self._ensure_pools()
                assert self._observer_pool is not None
                assert self._main_pool is not None

                candidates = await list_sessions_with_session_end(
                    self._observer_pool, hours=24, limit=100
                )
                for row in candidates:
                    sid = row["session_id"]
                    if await self.is_processed(sid):
                        continue
                    try:
                        await self._process_session(
                            sid, row.get("visitor_id"), row.get("tier")
                        )
                    except Exception:
                        log.exception("poll process_session failed session_id=%s", sid)
            except Exception:
                log.exception("DB poll iteration failed")

    async def run(self) -> None:
        await self._ensure_pools()
        redis = await self._redis_client()
        if redis is not None:
            await self._run_redis_mode(redis)
        else:
            await self._run_db_mode()


async def _amain() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )
    c = DiagnosisConsumer()
    try:
        await c.run()
    finally:
        await c.close()


def main() -> None:
    asyncio.run(_amain())


if __name__ == "__main__":
    main()
