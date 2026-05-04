"""
Optional Redis fan-out after PostgreSQL ingest.

If REDIS_URL is unset or Redis is unreachable, all pushes are skipped; /track still succeeds.

Queues (lists, LPUSH / BRPOP):
  ca:events:{visitor_id}  — every event (JSON), TTL 24h
  ca:diagnosis:queue      — session_end only (JSON) for downstream consumers
"""

from __future__ import annotations

import json
import logging
from typing import Any

import redis.asyncio as redis_async

from observer.config import settings

logger = logging.getLogger(__name__)

_redis: redis_async.Redis | None = None


async def get_redis() -> redis_async.Redis | None:
    """Return a connected client or None (no URL or connection failed)."""
    global _redis
    url = settings.redis_url.strip()
    if not url:
        return None
    if _redis is not None:
        return _redis
    try:
        client = redis_async.from_url(url, decode_responses=False)
        await client.ping()
        _redis = client
        return _redis
    except Exception:
        _redis = None
        return None


async def close_redis() -> None:
    global _redis
    if _redis is not None:
        try:
            await _redis.aclose()
        except Exception as exc:
            logger.warning("Redis close error: %s", exc)
        _redis = None


async def redis_push_enabled() -> bool:
    r = await get_redis()
    return r is not None


async def push_to_redis(data: dict[str, Any], tier: str) -> None:
    """
    Push lightweight job metadata. Full event bodies remain in PostgreSQL only.
    """
    global _redis
    visitor_id = data.get("visitor_id")
    if not visitor_id:
        return

    r = await get_redis()
    if not r:
        return

    session_id = data.get("session_id")
    event_type = data.get("event_type")

    envelope = {
        "session_id": session_id,
        "event_type": event_type,
        "tier": tier,
        "visitor_id": visitor_id,
    }
    raw = json.dumps(envelope, default=str).encode("utf-8")

    try:
        key = f"ca:events:{visitor_id}"
        await r.lpush(key, raw)
        await r.expire(key, 86400)

        if event_type == "session_end":
            dq = json.dumps(
                {
                    "session_id": session_id,
                    "visitor_id": visitor_id,
                    "tier": tier,
                },
                default=str,
            ).encode("utf-8")
            await r.lpush("ca:diagnosis:queue", dq)
    except Exception:
        await close_redis()
