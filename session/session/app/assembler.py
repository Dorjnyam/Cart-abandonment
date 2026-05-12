from __future__ import annotations

import json
import time
from datetime import datetime
from typing import Any

import redis.asyncio as redis_async

from app.config import SESSION_TTL_SECONDS, SESSION_WINDOWS
from app.db import write_session_to_pg
from app.emitter import emit_session_enriched
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
SESSION_HASH_TTL_MARGIN_SECONDS = 60


def _derive_page(payload: dict[str, Any]) -> str | None:
    for key in ("page", "page_name", "page_path", "path", "url", "page_url"):
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _event_matches(event_type: str, *candidates: str) -> bool:
    normalized = event_type.lower()
    return any(candidate in normalized for candidate in candidates)


def _payload_truthy(payload: dict[str, Any], key: str) -> bool:
    value = payload.get(key)
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes"}
    return bool(value)


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
    if event_payload.get("price") is not None and event_payload.get("product_price") is None:
        event_payload["product_price"] = event_payload["price"]
    if event_payload.get("category") is not None and event_payload.get("product_category") is None:
        event_payload["product_category"] = event_payload["category"]
    if event_payload.get("cart_total") is not None and event_payload.get("cart_value") is None:
        event_payload["cart_value"] = event_payload["cart_total"]
    if event_payload.get("quantity") is not None and event_payload.get("cart_item_count") is None:
        event_payload["cart_item_count"] = event_payload["quantity"]
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

    has_purchase_event = _event_matches(event_type, "purchase_success", "order_success")
    has_checkout_start = (
        current.get("has_checkout_start", "false") == "true"
        or event_type == "checkout_start"
        or _event_matches(event_type, "checkout_start")
    )
    has_cart_activity = (
        current.get("has_cart_activity", "false") == "true"
        or event_type in {"add_to_cart", "remove_from_cart", "cart_view"}
        or _event_matches(event_type, "add_to_cart", "remove_from_cart", "cart_view", "cart_add", "cart_remove")
    )
    is_purchase = current.get("is_completed_purchase", "false") == "true"
    is_currently_converted = current.get("state") == SessionState.CONVERTED.value
    # NEW → ACTIVE: тухайн session_id дээр хоёр дахь болон дараагийн event ирвэл сесс идэвхтэй болно.
    state = SessionState.NEW if not current else SessionState.ACTIVE
    if is_currently_converted:
        # CONVERTED нь terminal төлөв. Timeout эсвэл дараагийн non-purchase event ирсэн ч ABANDONED болгохгүй.
        state = SessionState.CONVERTED
    if has_purchase_event or _payload_truthy(event_payload, "is_order_success"):
        # ACTIVE → CONVERTED: purchase_success/order_success нь бизнесийн эцсийн үнэн төлөв.
        is_purchase = True
        state = SessionState.CONVERTED

    hset_mapping: dict[str, Any] = {
        **{k: str(v) for k, v in payload_updates.items()},
        "event_sequence": json.dumps(seq),
        "last_seen_at": event.timestamp.isoformat(),
        "is_completed_purchase": str(is_purchase).lower(),
        "has_purchase_success": str(is_purchase).lower(),
        "has_checkout_start": str(has_checkout_start).lower(),
        "has_cart_activity": str(has_cart_activity).lower(),
        "final_event_type": event_type,
        "session_state": state.value,
        "state": state.value,
        "time_on_page_total_ms": str(time_on_page_total_ms),
        "last_page": current_page or last_page or "",
        "last_page_seen_at": event.timestamp.isoformat(),
    }
    pipe.hset(key, mapping=hset_mapping)
    # Atomic event_count increment — avoids Python read-modify-write race
    pipe.hincrby(key, "event_count", 1)
    pipe.zadd(DEADLINE_ZSET, {str(event.session_id): time.time() + SESSION_TTL_SECONDS})
    # Keep the hash alive past the deadline so the sweeper can still read it,
    # flush to Postgres, and emit session_enriched after the idle timeout fires.
    pipe.expire(key, SESSION_TTL_SECONDS + SESSION_HASH_TTL_MARGIN_SECONDS)
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
        # ACTIVE → ABANDONED: idle timeout дуусахад зөвхөн converted биш сессийг abandoned болгоно.
        # UC2 converted сессийг timeout дахин ангилж болохгүй.
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

    # DB FIRST: session metadata-г эхлээд durable хадгална.
    # Дараа нь session_enriched Kafka message гарна; metadata нь ML feature биш боловч Main-д business truth болж дамжина.
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
