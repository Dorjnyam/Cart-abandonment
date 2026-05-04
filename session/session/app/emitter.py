from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from aiokafka import AIOKafkaProducer

from app.config import KAFKA_BOOTSTRAP, SESSION_ENRICHED_TOPIC
from app.models import AggregatedFields, SessionEnriched
from app.telemetry import record_event

logger = logging.getLogger(__name__)

_producer: AIOKafkaProducer | None = None
_producer_lock = asyncio.Lock()

# Fields that are session-service-internal and must not appear in aggregated_fields.
_SESSION_INTERNAL_KEYS = frozenset({
    "session_id", "visitor_id", "tenant_id", "started_at",
    "event_sequence",
    "state", "last_seen_at", "is_completed_purchase",
    "cart_add_count", "cart_remove_count", "checkout_attempts",
    "time_on_page_total_ms", "last_page", "last_page_seen_at",
    "page_views",
})


async def get_producer() -> AIOKafkaProducer:
    global _producer
    async with _producer_lock:
        if _producer is None:
            _producer = AIOKafkaProducer(
                bootstrap_servers=KAFKA_BOOTSTRAP,
                enable_idempotence=True,
                acks="all",
                compression_type="lz4",
                value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            )
            await _producer.start()
    return _producer


async def close_producer() -> None:
    global _producer
    if _producer is not None:
        await _producer.stop()
        _producer = None


async def emit_session_enriched(
    session_data: dict[str, Any], window_seconds: int | None
) -> None:
    from app.metrics import kafka_emit_failures

    producer = await get_producer()
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
    message = message_model.model_dump(mode="json")
    try:
        await producer.send_and_wait(
            SESSION_ENRICHED_TOPIC,
            value=message,
            key=str(message["session_id"]).encode(),  # partition locality
        )
    except Exception as exc:
        kafka_emit_failures.inc()
        record_event(
            "enriched_emit_failed",
            {
                "session_id": message.get("session_id"),
                "window_seconds": window_seconds,
                "error": str(exc),
            },
        )
        logger.exception("Kafka emit to %s failed", SESSION_ENRICHED_TOPIC)
        raise
    record_event(
        "enriched_emitted",
        {"session_id": message["session_id"], "window_seconds": window_seconds},
    )
