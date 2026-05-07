from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from aiokafka import AIOKafkaConsumer
import redis.asyncio as redis_async

from app.assembler import accumulate_event, flush_session
from app.config import (
    BACKPRESSURE_SLEEP_SEC,
    BOT_THRESHOLD,
    KAFKA_BOOTSTRAP,
    RAW_EVENTS_TOPIC,
    REDIS_MEMORY_LIMIT_BYTES,
    SESSION_CONSUMER_GROUP,
    SESSION_DEDUPE_EVENT_ID,
    SESSION_EVENT_SOURCE,
)
from app.metrics import messages_consumed, poison_pills
from app.models import RawEvent
from app.observer_adapter import observer_message_to_raw_event
from app.scheduler import ensure_window_snapshot_tasks
from app.telemetry import record_event

logger = logging.getLogger(__name__)

_REDIS_BACKOFF_DELAYS = [1, 2, 5, 10, 30]
FINAL_EVENT_TYPES = {"beforeunload", "session_end", "abandon_checkout"}
PURCHASE_EVENT_TYPES = {"purchase_success", "order_complete", "order_success"}


def dedupe_key_from_observer_dict(data: dict) -> str | None:
    if not SESSION_DEDUPE_EVENT_ID:
        return None
    event_id = data.get("event_id")
    if event_id is None:
        return None
    return f"session:evt:{event_id}"


async def skip_if_duplicate(
    r: redis_async.Redis,
    dedupe_key: str | None,
    *,
    duplicate_extra: dict[str, Any] | None = None,
) -> bool:
    """Return True if this delivery should be skipped (already processed)."""
    if not dedupe_key:
        return False
    stored = await r.set(dedupe_key, "1", nx=True, ex=7 * 86400)
    if not stored:
        details: dict[str, Any] = {"dedupe_key": dedupe_key}
        if duplicate_extra:
            details["incoming"] = duplicate_extra
        record_event("duplicate_skipped", details)
        return True
    return False


def normalize_kafka_value(value: object) -> RawEvent | None:
    """Support native ``RawEvent`` JSON (nested payload) and Observer flat ``event_out``."""
    if not isinstance(value, dict):
        return None
    if isinstance(value.get("payload"), dict) and value.get("tenant_id") is not None:
        try:
            return RawEvent.model_validate(value)
        except Exception as exc:
            logger.debug("normalize_kafka_value: not native RawEvent (%s)", exc)
    return observer_message_to_raw_event(value)


async def process_raw_event(r: redis_async.Redis, event: RawEvent) -> None:
    """Single-event pipeline shared by Kafka consumer and HTTP ingest."""
    if event.bot_score > BOT_THRESHOLD:
        record_event("bot_skipped", event.model_dump(mode="json"))
        return

    session_id = str(event.session_id)

    await accumulate_event(r, event)
    record_event("accumulated", event.model_dump(mode="json"))

    armed_windows = await ensure_window_snapshot_tasks(r, session_id)
    if armed_windows:
        record_event(
            "timers_scheduled",
            {"session_id": session_id, "windows_sec": armed_windows},
        )

    payload_end_reason = str(event.payload.model_extra.get("end_reason") or "").strip().lower()
    is_purchase = (
        event.payload.is_order_success is True
        or str(event.payload.model_extra.get("is_order_success", "")).lower() == "true"
        or event.event_type in PURCHASE_EVENT_TYPES
        or payload_end_reason == "purchase"
    )
    should_flush = (
        is_purchase
        or event.event_type in FINAL_EVENT_TYPES
        or payload_end_reason in {"unload", "abandoned", "abandon", "session_end"}
    )
    if should_flush:
        reason = "purchase" if is_purchase else (payload_end_reason or "unload")
        await flush_session(r, session_id, end_reason=reason)
        record_event("final_flushed", {"session_id": session_id, "reason": reason})


async def start_consumer(r: redis_async.Redis) -> None:
    if SESSION_EVENT_SOURCE == "http":
        logger.info("SESSION_EVENT_SOURCE=http — Kafka consumer disabled")
        try:
            while True:
                await asyncio.sleep(86400)
        except asyncio.CancelledError:
            raise

    consumer = AIOKafkaConsumer(
        RAW_EVENTS_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id=SESSION_CONSUMER_GROUP,
        auto_offset_reset="earliest",
        enable_auto_commit=False,  # Manual commit after successful processing
        value_deserializer=lambda value: json.loads(value.decode("utf-8")),
    )
    await consumer.start()
    _bp_check_counter = 0
    try:
        async for message in consumer:
            import time as _time
            _t0 = _time.monotonic()

            # Check Redis memory pressure every 100 messages to avoid per-message overhead.
            _bp_check_counter += 1
            if _bp_check_counter >= 100:
                _bp_check_counter = 0
                try:
                    mem_info = await r.info("memory")
                    if int(mem_info["used_memory"]) > REDIS_MEMORY_LIMIT_BYTES:
                        record_event("backpressure_sleep", {"used_memory": mem_info["used_memory"]})
                        await asyncio.sleep(BACKPRESSURE_SLEEP_SEC)
                        # Fall through — still process this message; do NOT skip it.
                except Exception as exc:
                    logger.warning("Redis memory check failed: %s", exc)

            raw = message.value
            event = normalize_kafka_value(raw)
            if event is None:
                keys = list(raw.keys()) if isinstance(raw, dict) else []
                logger.warning("Kafka message skipped: invalid shape keys=%s", keys)
                record_event(
                    "raw_invalid",
                    {
                        "keys_preview": keys[:25],
                        "event_type": raw.get("event_type") if isinstance(raw, dict) else None,
                    },
                )
                poison_pills.inc()
                # Commit immediately so a poison pill never blocks the consumer on restart.
                await consumer.commit()
                continue

            if isinstance(raw, dict):
                if await skip_if_duplicate(
                    r,
                    dedupe_key_from_observer_dict(raw),
                    duplicate_extra=raw,
                ):
                    await consumer.commit()
                    continue

            record_event("raw_received", event.model_dump(mode="json"))
            messages_consumed.inc()

            try:
                await process_raw_event(r, event)
                await consumer.commit()  # Commit only after successful processing
            except redis_async.RedisError as exc:
                # Redis is temporarily unreachable — back off, then continue without
                # committing so the message is reprocessed after reconnect.
                logger.error(
                    "Redis error processing session=%s event_type=%s — backing off: %s",
                    getattr(event, "session_id", "?"), event.event_type, exc,
                )
                for delay in _REDIS_BACKOFF_DELAYS:
                    await asyncio.sleep(delay)
                    try:
                        await r.ping()
                        break
                    except Exception:
                        pass
            except Exception:
                # Transient or unexpected error — log, do NOT commit (message replayed
                # on restart), do NOT raise (service must stay alive).
                logger.exception(
                    "process_raw_event failed session=%s event_type=%s — offset not committed",
                    getattr(event, "session_id", "?"), event.event_type,
                )

            from app.metrics import processing_latency
            processing_latency.observe(_time.monotonic() - _t0)

    finally:
        await consumer.stop()
