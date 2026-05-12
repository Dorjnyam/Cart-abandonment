"""
Kafka producer for Observer — publish raw events to the ``raw_events`` topic.

Lifecycle:
    await start_kafka()   # called in lifespan startup
    await stop_kafka()    # called in lifespan finally block

Publishing:
    await publish(event_dict)

If KAFKA_BOOTSTRAP_SERVERS is unset or the broker is unreachable the module
degrades gracefully: start_kafka() logs a warning and every publish() call is
a no-op so /events still returns 200.
"""

from __future__ import annotations

import json
import logging
from typing import Any

from observer.config import settings

logger = logging.getLogger(__name__)

_producer = None  # AIOKafkaProducer | None

TOPIC = "raw_events"


def _bootstrap_servers() -> str:
    return settings.kafka_bootstrap_servers.strip()


async def start_kafka() -> bool:
    """Start the producer. Returns True if Kafka is available."""
    global _producer
    servers = _bootstrap_servers()
    if not servers:
        logger.warning("KAFKA_BOOTSTRAP_SERVERS not set — Kafka publish disabled")
        return False
    try:
        from aiokafka import AIOKafkaProducer  # import here so missing dep is a soft error

        _producer = AIOKafkaProducer(
            bootstrap_servers=servers,
            value_serializer=lambda v: json.dumps(v, default=str).encode("utf-8"),
            acks="all",            # all in-sync replicas must acknowledge
            enable_idempotence=True,  # exactly-once delivery; requires acks=all
            compression_type="gzip",  # lz4 requires optional C lib; gzip is always available
            max_batch_size=65536,
            linger_ms=5,           # allow 5 ms batching window
            request_timeout_ms=settings.kafka_request_timeout_ms,
            retry_backoff_ms=200,
        )
        await _producer.start()
        logger.info("Kafka producer started (bootstrap=%s, topic=%s)", servers, TOPIC)
        return True
    except ImportError:
        logger.warning("aiokafka not installed — Kafka publish disabled")
        _producer = None
        return False
    except Exception as exc:
        logger.warning("Kafka producer start failed (%s) — publish disabled", exc)
        _producer = None
        return False


async def stop_kafka() -> None:
    """Graceful shutdown — flush buffered messages then close."""
    global _producer
    if _producer is None:
        return
    try:
        await _producer.stop()
        logger.info("Kafka producer stopped")
    except Exception as exc:
        logger.warning("Kafka producer stop error: %s", exc)
    finally:
        _producer = None


async def publish(event: dict[str, Any]) -> bool:
    """
    Publish one event dict to ``raw_events``.

    Амжилттай бол True, Kafka unavailable эсвэл send fail бол False.
    Exception гадагш шидэхгүй: Observer-ийн DB evidence write амжилттай болсон тохиолдолд
    Kafka failure нь хэрэглэгчийн `/track` response-г эвдэхгүй, харин log дээр үлдэнэ.
    """
    if _producer is None:
        return False
    try:
        key = (event.get("session_id") or "").encode("utf-8") or None
        await _producer.send(TOPIC, key=key, value=event)
        return True
    except Exception as exc:
        logger.warning("Kafka publish failed: %s", exc)
        return False


def kafka_enabled() -> bool:
    return _producer is not None
