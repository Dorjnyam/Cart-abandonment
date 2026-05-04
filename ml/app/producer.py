import json
import logging

from aiokafka import AIOKafkaProducer

from app.config import settings
from app.schemas import PredictedClass, PredictionOut, PredictionResult

logger = logging.getLogger(__name__)

_producer: AIOKafkaProducer | None = None


async def start_producer() -> None:
    global _producer
    _producer = AIOKafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_serializer=lambda value: json.dumps(value).encode(),
        # Idempotent producer: prevents duplicate messages on retry.
        # aiokafka automatically sets acks=-1 when enable_idempotence=True.
        enable_idempotence=True,
        compression_type="lz4",
    )
    await _producer.start()
    logger.info("Kafka producer ready (idempotent, lz4)")


def get_producer() -> AIOKafkaProducer | None:
    return _producer


async def publish_prediction(prediction: PredictionOut) -> None:
    if _producer is None:
        raise RuntimeError("Kafka producer is not started")

    payload = {
        "session_id": str(prediction.session_id),
        "tenant_id": str(prediction.tenant_id),
        "window_seconds": prediction.window_seconds,
        "abandon_probability": prediction.abandon_probability,
        "diagnosis_category": prediction.diagnosis_category,
        "shap_values": prediction.shap_values,
        "model_version": prediction.model_version,
        "predicted_at": prediction.predicted_at.isoformat(),
    }
    session_id = str(prediction.session_id)
    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            await _producer.send_and_wait(
                settings.kafka_output_topic,
                value=payload,
                key=session_id.encode(),
            )
            return
        except Exception as exc:
            last_exc = exc
            if attempt < 2:
                import asyncio
                await asyncio.sleep(1.0)

    from app.metrics import kafka_publish_failures
    kafka_publish_failures.inc()
    logger.error(
        "Failed to publish to %s after 3 attempts session_id=%s: %s",
        settings.kafka_output_topic,
        session_id,
        last_exc,
    )
    raise RuntimeError(
        f"Kafka publish failed after 3 attempts for session {session_id}"
    ) from last_exc


async def publish_prediction_v2(prediction: PredictionResult) -> None:
    if _producer is None:
        raise RuntimeError("Kafka producer is not started")

    score = prediction.prediction_score
    confidence = (
        "high" if abs(score - 0.5) > 0.3
        else "medium" if abs(score - 0.5) > 0.1
        else "low"
    )
    payload = {
        "session_id": str(prediction.session_id),
        "visitor_id": str(prediction.visitor_id) if prediction.visitor_id is not None else None,
        "prediction_score": score,
        "predicted_class": prediction.predicted_class.value,
        "prediction": "abandon" if prediction.predicted_class == PredictedClass.abandoned else "convert",
        "confidence": confidence,
        "shap_values": prediction.shap_values,
        "model_version": prediction.model_version,
        "timestamp": prediction.timestamp.isoformat(),
        "xgb_score": prediction.xgb_score,
        "lstm_score": prediction.lstm_score,
        "ensemble_method": prediction.ensemble_method,
    }
    session_id = str(prediction.session_id)
    last_exc: Exception | None = None
    for attempt in range(3):
        try:
            await _producer.send_and_wait(
                settings.kafka_output_topic_v2,
                value=payload,
                key=session_id.encode(),
            )
            return
        except Exception as exc:
            last_exc = exc
            if attempt < 2:
                import asyncio
                await asyncio.sleep(1.0)

    from app.metrics import kafka_publish_failures
    kafka_publish_failures.inc()
    logger.error(
        "Failed to publish to %s after 3 attempts session_id=%s: %s",
        settings.kafka_output_topic_v2,
        session_id,
        last_exc,
    )
    raise RuntimeError(
        f"Kafka v2 publish failed after 3 attempts for session {session_id}"
    ) from last_exc


async def stop_producer() -> None:
    global _producer
    if _producer is not None:
        await _producer.stop()
        _producer = None
