from __future__ import annotations

import json
import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Any

import redis as redis_sync
from kafka import KafkaProducer

from app.config import KAFKA_BOOTSTRAP, REDIS_URL, SESSION_ENRICHED_TOPIC, SESSION_WINDOWS
from app.utils import _decode_hash
from celery_app import celery

_MAX_WINDOW_SEC = max(SESSION_WINDOWS)

logger = logging.getLogger(__name__)

# Idempotency key TTL = countdown + margin so the key outlives the Celery fire time.
_WIN_SCHED_IDEM_MARGIN_SEC = 120


def _win_sched_key(session_id: str, window: int) -> str:
    return f"session_winsched:{session_id}:{window}"


def _snapshot_done_field(window: int) -> str:
    return f"snapshot_done_{window}"


def _parse_started_at(raw: str) -> datetime | None:
    try:
        s = raw.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (TypeError, ValueError):
        return None


def _snapshot_anchor(started_at: datetime, now: datetime) -> datetime:
    """
    Use ``started_at`` while its snapshot windows can still fire. If every window deadline
    is already past (stale Redis session or bad client clock), anchor from ``now`` so the
    pipeline can still schedule 30/60/90s tasks on new activity.
    """
    if started_at + timedelta(seconds=_MAX_WINDOW_SEC) >= now:
        return started_at
    logger.info(
        "window anchor: session deadlines past started_at=%s now=%s — re-anchoring from now",
        started_at.isoformat(),
        now.isoformat(),
    )
    return now


def _build_enriched_message(session_data: dict[str, str], window_seconds: int | None) -> dict[str, Any]:
    """Build the session_enriched payload from raw Redis hash data (pure, no I/O)."""
    from app.models import AggregatedFields, SessionEnriched

    _SESSION_INTERNAL_KEYS = frozenset({
        "session_id", "visitor_id", "tenant_id", "started_at",
        "event_sequence",
        "state", "last_seen_at", "is_completed_purchase",
        "cart_add_count", "cart_remove_count", "checkout_attempts",
        "time_on_page_total_ms", "last_page", "last_page_seen_at",
        "page_views",
    })
    raw_aggregated = {
        k: v
        for k, v in session_data.items()
        if k not in _SESSION_INTERNAL_KEYS
        and not k.startswith("snapshot_done_")
    }
    message_model = SessionEnriched(
        session_id=session_data["session_id"],
        visitor_id=session_data["visitor_id"],
        tenant_id=session_data["tenant_id"],
        started_at=session_data["started_at"],
        window_seconds=window_seconds,
        event_sequence=json.loads(session_data.get("event_sequence", "[]")),
        aggregated_fields=AggregatedFields(**raw_aggregated),
    )
    return message_model.model_dump(mode="json")


async def ensure_window_snapshot_tasks(r: Any, session_id: str) -> list[int]:
    """
    Arm at most one Celery countdown task per window, anchored to session ``started_at``.

    Skips windows already emitted (``snapshot_done_{w}``), past deadlines, or already armed
    (Redis ``SET NX`` on ``session_winsched:...``).
    """
    key = f"session:{session_id}"
    raw = await r.hgetall(key)
    if not raw:
        return []

    data = _decode_hash(raw)
    started_raw = data.get("started_at")
    if not started_raw:
        return []

    started_at = _parse_started_at(started_raw)
    if started_at is None:
        logger.warning("ensure_window_snapshot_tasks: bad started_at for session %s", session_id)
        return []

    now = datetime.now(timezone.utc)
    anchor = _snapshot_anchor(started_at, now)
    armed: list[int] = []

    for window in SESSION_WINDOWS:
        done_field = _snapshot_done_field(window)
        if data.get(done_field) in ("1", "true", "True"):
            continue

        deadline = anchor + timedelta(seconds=window)
        delay_sec = (deadline - now).total_seconds()
        if delay_sec <= 0:
            continue

        countdown = max(1, math.ceil(delay_sec))
        idem_key = _win_sched_key(session_id, window)
        ex_ttl = countdown + _WIN_SCHED_IDEM_MARGIN_SEC

        got_lock = await r.set(idem_key, "1", nx=True, ex=ex_ttl)
        if not got_lock:
            continue

        emit_window_snapshot.apply_async(args=[session_id, window], countdown=countdown)
        armed.append(window)

    return armed


@celery.task(name="session.emit_window_snapshot")
def emit_window_snapshot(session_id: str, window_seconds: int) -> None:
    """
    Celery task: read session from Redis, emit a windowed session_enriched to Kafka.

    Uses synchronous redis-py and kafka-python so there is no asyncio event loop
    complexity inside a Celery worker. Each invocation owns its connections and
    closes them in finally blocks to prevent leaks.
    """
    r = redis_sync.Redis.from_url(REDIS_URL)
    try:
        key = f"session:{session_id}"
        raw = r.hgetall(key)
        if not raw:
            return

        session_data = _decode_hash(raw)
        idem_key = _win_sched_key(session_id, window_seconds)

        producer = KafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            enable_idempotence=True,
            acks="all",
            compression_type="lz4",
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
        )
        try:
            msg = _build_enriched_message(session_data, window_seconds)
            producer.send(
                SESSION_ENRICHED_TOPIC,
                value=msg,
                key=session_id.encode(),
            )
            producer.flush()
            r.hset(key, _snapshot_done_field(window_seconds), "1")
        except Exception:
            # Release idempotency lock so the task can be retried.
            r.delete(idem_key)
            raise
        finally:
            producer.close()
    finally:
        r.close()
