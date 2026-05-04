from __future__ import annotations

import json
import time
from datetime import datetime
from typing import Any

import redis.asyncio as redis_async

from app.config import SESSION_TTL_SECONDS, SESSION_WINDOWS
from app.metrics import (
    sessions_created,
    sessions_finalized,
    session_duration_histogram,
)
from app.models import RawEvent, SessionState
from app.utils import _decode_hash, _safe_float, _safe_int

COUNTER_FIELDS = {
    "rage_click", "back_navigation", "cart_churn_count",
    "scroll_up_count", "click_count", "tab_hidden_count",
    "copy_count", "form_fields_count", "outbound_click",
    "js_error", "page_view_count",
}
MAX_FIELDS = {"checkout_step", "form_fields_touched", "max_scroll_pct", "checkout_step_detected"}
LATEST_FIELDS = {"page_load_ms"}  # per-page metric — overwrite, never sum
DEADLINE_ZSET = "session_deadlines"
FLUSH_LOCK_TTL = 30  # seconds; prevents double-flush from sweeper + consumer races


def _derive_page(payload: dict[str, Any]) -> str | None:
    for key in ("page", "page_name", "page_path", "path", "url", "page_url"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _event_matches(event_type: str, *candidates: str) -> bool:
    normalized = event_type.lower()
    return any(candidate in normalized for candidate in candidates)


async def accumulate_event(r: redis_async.Redis, event: RawEvent) -> None:
    key = f"session:{event.session_id}"
    current_raw = await r.hgetall(key)
    current = _decode_hash(current_raw)
    pipe = r.pipeline()

    is_new_session = not current
    if is_new_session:
        pipe.hset(
            key,
            mapping={
                "session_id": str(event.session_id),
                "visitor_id": str(event.visitor_id),
                "tenant_id": str(event.tenant_id),
                "started_at": event.timestamp.isoformat(),
                "event_count": "0",
                "page_view_count": "0",
                "event_sequence": "[]",
                "is_completed_purchase": "false",
                "state": SessionState.NEW.value,
            },
        )
        pipe.set(
            f"visitor:{event.visitor_id}:active",
            str(event.session_id),
            ex=SESSION_TTL_SECONDS,
        )

    event_payload = event.payload.model_dump(exclude_none=True)
    payload_updates: dict[str, Any] = {}
    for field, value in event_payload.items():
        current_val = current.get(field)
        if field in COUNTER_FIELDS:
            # Atomic increment — avoids Python read-modify-write race
            pipe.hincrby(key, field, _safe_int(value))
        elif field in MAX_FIELDS:
            payload_updates[field] = max(_safe_float(current_val), _safe_float(value))
        elif field in LATEST_FIELDS:
            payload_updates[field] = value
        elif field.endswith("_ms") or field == "time_on_page_sec":
            payload_updates[field] = _safe_float(current_val) + _safe_float(value)
        else:
            payload_updates[field] = value

    event_type = event.event_type

    # Capture url/referrer from event metadata (stripped from payload by observer_adapter)
    if hasattr(event, "url") and event.url:
        payload_updates.setdefault("url", event.url)
    if hasattr(event, "referrer") and event.referrer:
        payload_updates.setdefault("referrer", event.referrer)

    if event_type in ("page_view", "pageview"):
        pipe.hincrby(key, "page_view_count", 1)

    # Atomic cart/checkout counters — avoids Python read-modify-write race
    if _event_matches(event_type, "add_to_cart", "cart_add"):
        pipe.hincrby(key, "cart_add_count", 1)
    if _event_matches(event_type, "remove_from_cart", "cart_remove"):
        pipe.hincrby(key, "cart_remove_count", 1)
    if _event_matches(event_type, "checkout"):
        pipe.hincrby(key, "checkout_attempts", 1)

    current_page = _derive_page(event_payload)
    last_page = current.get("last_page")
    last_page_seen_at = current.get("last_page_seen_at")
    time_on_page_total_ms = _safe_float(current.get("time_on_page_total_ms"))

    if last_page and last_page_seen_at and current_page and current_page != last_page:
        try:
            last_ts = datetime.fromisoformat(last_page_seen_at.replace("Z", "+00:00"))
        except ValueError:
            last_ts = event.timestamp
        delta_ms = max(0.0, (event.timestamp - last_ts).total_seconds() * 1000.0)
        time_on_page_total_ms += delta_ms

    seq = json.loads(current.get("event_sequence", "[]"))
    seq.append(event_type)

    is_purchase = current.get("is_completed_purchase", "false") == "true"
    state = SessionState.NEW if not current else SessionState.ACTIVE
    if event_payload.get("is_order_success") is True or event_payload.get("is_order_success") == "true":
        is_purchase = True
        state = SessionState.CONVERTED

    hset_mapping: dict[str, Any] = {
        **{k: str(v) for k, v in payload_updates.items()},
        "event_sequence": json.dumps(seq),
        "last_seen_at": event.timestamp.isoformat(),
        "is_completed_purchase": str(is_purchase).lower(),
        "state": state.value,
        "time_on_page_total_ms": str(time_on_page_total_ms),
        "last_page": current_page or last_page or "",
        "last_page_seen_at": event.timestamp.isoformat(),
    }
    pipe.hset(key, mapping=hset_mapping)
    # Atomic event_count increment — avoids Python read-modify-write race
    pipe.hincrby(key, "event_count", 1)
    pipe.zadd(DEADLINE_ZSET, {str(event.session_id): time.time() + SESSION_TTL_SECONDS})
    pipe.expire(key, SESSION_TTL_SECONDS)
    pipe.expire(f"visitor:{event.visitor_id}:active", SESSION_TTL_SECONDS)
    await pipe.execute()

    if is_new_session:
        sessions_created.inc()


async def pop_expired_sessions(r: redis_async.Redis, limit: int = 100) -> list[str]:
    now = time.time()
    session_ids = await r.zrangebyscore(DEADLINE_ZSET, min=0, max=now, start=0, num=limit)
    if not session_ids:
        return []

    normalized: list[str] = []
    for sid in session_ids:
        normalized.append(sid.decode() if isinstance(sid, bytes) else str(sid))

    if normalized:
        await r.zrem(DEADLINE_ZSET, *normalized)
    return normalized


async def flush_session(
    r: redis_async.Redis,
    session_id: str,
    end_reason: str = "timeout",
) -> None:
    from app.db import write_session_to_pg
    from app.emitter import emit_session_enriched

    # Redis SET NX flush-lock: prevents double-flush from sweeper + consumer racing
    lock_key = f"session_flush_lock:{session_id}"
    acquired = await r.set(lock_key, "1", nx=True, ex=FLUSH_LOCK_TTL)
    if not acquired:
        return

    key = f"session:{session_id}"
    raw = await r.hgetall(key)
    if not raw:
        await r.delete(lock_key)
        return

    session_data = _decode_hash(raw)
    if session_data.get("state") != SessionState.CONVERTED.value:
        session_data["state"] = SessionState.ABANDONED.value
        await r.hset(key, mapping={"state": SessionState.ABANDONED.value})

    session_data.setdefault("end_reason", end_reason)

    try:
        started = datetime.fromisoformat(session_data["started_at"])
        ended = datetime.fromisoformat(
            session_data.get("last_seen_at", session_data["started_at"])
        )
        duration_sec = max(0.0, (ended - started).total_seconds())
        session_data["session_duration_sec"] = duration_sec
    except (KeyError, ValueError):
        duration_sec = 0.0
        session_data.setdefault("session_duration_sec", 0.0)

    # DB FIRST — durable record before broadcasting.
    # If Kafka fails after DB write, Feature service misses this window but DB is safe.
    # The session can be re-emitted on retry if needed. Reversing the order would lose
    # the DB record if Kafka succeeds but DB write fails.
    await write_session_to_pg(session_data)
    await emit_session_enriched(session_data, window_seconds=None)

    visitor_id = session_data.get("visitor_id", "")
    pipe = r.pipeline()
    pipe.delete(key)
    pipe.delete(lock_key)
    pipe.zrem(DEADLINE_ZSET, session_id)
    if visitor_id:
        pipe.delete(f"visitor:{visitor_id}:active")
    for window in SESSION_WINDOWS:
        pipe.delete(f"session_timer:{session_id}:{window}")
        pipe.delete(f"session_winsched:{session_id}:{window}")
    await pipe.execute()

    sessions_finalized.inc()
    session_duration_histogram.observe(duration_sec)
