import json
import logging
import os
import signal
from typing import Any, Dict

from django.core.management.base import BaseCommand, CommandError
from kafka import KafkaConsumer, KafkaProducer

from apps.analytics.tasks import process_prediction

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
        )
        producer = KafkaProducer(bootstrap_servers=bootstrap_servers.split(","))

        self.stdout.write(self.style.SUCCESS(f"Consuming Kafka topic={topic} group_id={group_id}"))

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
                    visitor_id = payload.get("visitor_id")
                    prediction_score = float(
                        payload.get("prediction_score")
                        or payload.get("abandonment_probability", 0.0)
                    )
                    predicted_class = str(
                        payload.get("predicted_class") or payload.get("prediction", "abandoned")
                    )
                    shap_values = payload.get("shap_values") or {}
                    model_variant = payload.get("model_variant", "baseline")
                    abandonment_probability = float(payload.get("abandonment_probability", prediction_score))
                    confidence = float(payload.get("confidence", 0.5))
                    model_version = payload.get("model_version")
                    predicted_at = payload.get("predicted_at")
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
                    process_prediction.apply_async(
                        kwargs={
                            "session_id": session_id,
                            "tenant_id": tenant_id,
                            "prediction_score": prediction_score,
                            "predicted_class": predicted_class,
                            "shap_values": shap_values,
                            "model_variant": model_variant,
                            "abandonment_probability": abandonment_probability,
                            "confidence": confidence,
                            "model_version": model_version,
                            "predicted_at": predicted_at,
                            "visitor_id": visitor_id,
                        },
                        ignore_result=False,
                    )
                    consumer.commit()
                except Exception as exc:
                    logger.exception("Error while dispatching process_prediction: %s", exc)
                    # Do not commit; message will be retried on next run.
        finally:
            consumer.close()
            producer.close()
