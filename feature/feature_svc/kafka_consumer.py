from __future__ import annotations

import json
from collections.abc import Awaitable, Callable
from typing import Any

from aiokafka import AIOKafkaConsumer

from config import FEATURE_CONSUMER_GROUP, KAFKA_BOOTSTRAP, SESSION_ENRICHED_TOPIC


async def run_consumer(
    on_message: Callable[[dict[str, Any], AIOKafkaConsumer], Awaitable[None]]
) -> None:
    consumer = AIOKafkaConsumer(
        SESSION_ENRICHED_TOPIC,
        bootstrap_servers=KAFKA_BOOTSTRAP,
        group_id=FEATURE_CONSUMER_GROUP,
        auto_offset_reset="earliest",
        enable_auto_commit=False,
        max_poll_interval_ms=300_000,  # 5 min; must exceed worst-case compute time
        value_deserializer=lambda b: json.loads(b.decode()),
    )
    await consumer.start()
    try:
        async for message in consumer:
            await on_message(message.value, consumer)
    finally:
        await consumer.stop()
