import json
import logging
import os
import signal
import time
from typing import Any, Dict

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from kafka import KafkaConsumer, KafkaProducer

from apps.analytics.prediction_pipeline import handle_prediction_payload

logger = logging.getLogger(__name__)

_shutdown = False


def _handle_sigterm(signum, frame):
    global _shutdown
    _shutdown = True


def _send_to_dlq(producer: KafkaProducer | None, topic: str, raw_bytes: bytes, reason: str) -> None:
    if producer is None:
        logger.error("Dropping invalid prediction_done message because DLQ producer is unavailable: %s", reason)
        return
    try:
        producer.send(topic, value=raw_bytes, headers=[("reason", reason.encode("utf-8"))])
        producer.flush(timeout=5)
    except Exception as exc:
        logger.error("Failed to write prediction_done message to DLQ: %s", exc)


def _set_consumer_ready(topic: str, group_id: str, ready: bool, reason: str = "") -> None:
    try:
        import redis

        client = redis.Redis.from_url(settings.REDIS_URL)
        key = "main:prediction_done_consumer:ready"
        payload = json.dumps(
            {
                "ready": ready,
                "topic": topic,
                "group_id": group_id,
                "reason": reason,
                "updated_at": time.time(),
            }
        )
        client.set(key, payload, ex=300)
    except Exception as exc:
        logger.warning("Could not update prediction consumer readiness marker: %s", exc)


class Command(BaseCommand):
    help = "Consume prediction_done Kafka topic and dispatch Celery tasks with manual offset commit."

    def handle(self, *args: Any, **options: Any) -> None:
        bootstrap_servers = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "")
        topic = os.getenv("KAFKA_PREDICTION_DONE_TOPIC", "prediction_done")
        group_id = os.getenv("KAFKA_CONSUMER_GROUP", "main-service-predictions")
        dlq_topic = os.getenv("KAFKA_DLQ_TOPIC", "prediction_done_dlq")

        if not bootstrap_servers:
            raise CommandError("KAFKA_BOOTSTRAP_SERVERS must be set for Kafka consumption.")
        if group_id == "main-service-predictions":
            logger.warning(
                "Using default KAFKA_CONSUMER_GROUP=%s; set an environment-specific group in production.",
                group_id,
            )

        signal.signal(signal.SIGTERM, _handle_sigterm)

        consumer = KafkaConsumer(
            topic,
            bootstrap_servers=bootstrap_servers.split(","),
            enable_auto_commit=False,
            group_id=group_id,
            auto_offset_reset=os.getenv("KAFKA_AUTO_OFFSET_RESET", "earliest"),
        )
        producer = KafkaProducer(bootstrap_servers=bootstrap_servers.split(","))

        self.stdout.write(self.style.SUCCESS(f"Consuming Kafka topic={topic} group_id={group_id}"))
        deadline = time.time() + int(os.getenv("KAFKA_TOPIC_READY_TIMEOUT_SECONDS", "60"))
        partitions = None
        while time.time() < deadline:
            partitions = consumer.partitions_for_topic(topic)
            if partitions:
                logger.info(
                    "Prediction consumer ready topic=%s partitions=%s group_id=%s",
                    topic,
                    sorted(partitions),
                    group_id,
                )
                _set_consumer_ready(topic, group_id, True)
                break
            logger.info("Waiting for Kafka topic metadata topic=%s", topic)
            time.sleep(1)
        if not partitions:
            _set_consumer_ready(topic, group_id, False, "topic metadata unavailable")
            raise CommandError(f"Kafka topic {topic!r} has no partition metadata after startup wait.")

        try:
            for message in consumer:
                if _shutdown:
                    logger.info("SIGTERM received; shutting down prediction_done consumer gracefully")
                    break

                raw_value = message.value or b""
                try:
                    payload: Dict[str, Any] = json.loads(raw_value.decode("utf-8"))
                except (UnicodeDecodeError, json.JSONDecodeError) as exc:
                    logger.warning("Invalid JSON on prediction_done topic: %s", exc)
                    _send_to_dlq(producer, dlq_topic, raw_value, f"json_error: {exc}")
                    consumer.commit()
                    continue

                try:
                    session_id = payload.get("session_id")
                    tenant_id = payload.get("tenant_id")
                    prediction_score = float(
                        payload.get("prediction_score")
                        or payload.get("abandonment_probability", 0.0)
                    )
                    payload.setdefault("abandonment_probability", prediction_score)
                    payload.setdefault("predicted_class", payload.get("prediction", "abandoned"))
                except (TypeError, ValueError) as exc:
                    logger.warning("Invalid field type in prediction_done payload: %s", exc)
                    _send_to_dlq(producer, dlq_topic, raw_value, f"field_error: {exc}")
                    consumer.commit()
                    continue

                if not session_id or tenant_id is None:
                    reason = "missing required field session_id or tenant_id"
                    logger.warning("Missing required field session_id or tenant_id in prediction_done payload")
                    _send_to_dlq(producer, dlq_topic, raw_value, reason)
                    consumer.commit()
                    continue

                try:
                    handle_prediction_payload(payload)
                    consumer.commit()
                except Exception as exc:
                    logger.exception("Error while dispatching process_prediction: %s", exc)
                    # Do not commit; message will be retried on next run.
        finally:
            _set_consumer_ready(topic, group_id, False, "consumer stopped")
            consumer.close()
            producer.close()
