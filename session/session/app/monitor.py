from __future__ import annotations

import json
import uuid

from aiokafka import AIOKafkaConsumer

from app.config import KAFKA_BOOTSTRAP, SESSION_ENRICHED_TOPIC
from app.telemetry import record_event


async def monitor_session_enriched() -> None:
    group_id = f"session-viewer-monitor-{uuid.uuid4()}"
    consumer = AIOKafkaConsumer(
        SESSION_ENRICHED_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id=group_id,
        auto_offset_reset="latest",
        enable_auto_commit=True,
        value_deserializer=lambda value: json.loads(value.decode("utf-8")),
    )
    await consumer.start()
    try:
        async for message in consumer:
            payload = message.value
            record_event(
                "monitor_enriched_seen",
                {
                    "session_id": payload.get("session_id"),
                    "window_seconds": payload.get("window_seconds"),
                },
            )
    finally:
        await consumer.stop()
