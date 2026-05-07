import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer

from app.config import settings
from app.db import write_prediction
from app.metrics import active_inference_tasks, inference_failures, messages_consumed, predictions_produced
from app.pipeline import pipeline
from app.producer import get_producer, publish_prediction, publish_prediction_v2
from app.runtime_state import (
    decrement_active_inference,
    increment_active_inference,
    record_dlq,
    record_feature_vector,
    record_message_received,
    record_prediction_failure,
    record_prediction_success,
)
from app.schemas import FeatureVector

logger = logging.getLogger(__name__)

_consumer: AIOKafkaConsumer | None = None
_consumer_task: asyncio.Task | None = None

# Per-message retry counter keyed by "topic-partition-offset".
_retry_counts: dict[str, int] = {}
MAX_RETRIES = 3


async def start_consumer() -> None:
    global _consumer, _consumer_task
    _consumer = AIOKafkaConsumer(
        settings.kafka_input_topic,
        bootstrap_servers=settings.kafka_bootstrap_servers,
        group_id=settings.kafka_consumer_group,
        auto_offset_reset=settings.kafka_auto_offset_reset,
        enable_auto_commit=False,
        value_deserializer=lambda value: json.loads(value.decode()),
    )
    await _consumer.start()
    logger.info("Kafka consumer started on topic %s", settings.kafka_input_topic)
    _consumer_task = asyncio.create_task(_consume_loop())


async def _publish_dlq(raw_payload: dict) -> None:
    """Forward a poison-pill message to the dead-letter topic."""
    producer = get_producer()
    if producer is None:
        logger.error("DLQ publish skipped: Kafka producer not available")
        return
    try:
        await producer.send_and_wait(
            settings.kafka_dlq_topic,
            value=json.dumps(raw_payload).encode(),
        )
        logger.info("DLQ: message forwarded to %s", settings.kafka_dlq_topic)
    except Exception:
        logger.exception("DLQ: failed to forward message to dead-letter topic")


async def _consume_loop() -> None:
    if _consumer is None:
        raise RuntimeError("Kafka consumer is not started")

    async for msg in _consumer:
        messages_consumed.inc()
        record_message_received(msg.topic, msg.partition, msg.offset)
        fv: FeatureVector | None = None
        msg_key = f"{msg.topic}-{msg.partition}-{msg.offset}"
        try:
            logger.info(
                "Processing message partition=%d offset=%d",
                msg.partition,
                msg.offset,
            )
            fv = FeatureVector(**msg.value)
            record_feature_vector(fv, topic=msg.topic, partition=msg.partition, offset=msg.offset)
            logger.info("Inference start session_id=%s", fv.session_id)

            active_inference_tasks.inc()
            increment_active_inference()
            try:
                prediction_legacy, prediction_v2 = await pipeline.predict(fv)
            finally:
                active_inference_tasks.dec()
                decrement_active_inference()

            await write_prediction(prediction_legacy, feature_version=fv.version)
            await publish_prediction(prediction_v2)
            await publish_prediction_v2(prediction_v2)
            await _consumer.commit()
            predictions_produced.inc()
            _retry_counts.pop(msg_key, None)
            record_prediction_success(fv, prediction_v2)

            logger.info(
                "Predicted session=%s window=%s score=%.3f xgb=%.3f lstm=%s class=%s",
                fv.session_id,
                fv.window_seconds,
                prediction_v2.abandonment_probability,
                prediction_v2.xgb_score,
                "disabled",
                prediction_v2.predicted_class.value,
            )
        except Exception as exc:
            session_id = fv.session_id if fv is not None else "unknown"
            logger.exception("Prediction failed session_id=%s", session_id)
            inference_failures.labels(model="pipeline").inc()

            _retry_counts[msg_key] = _retry_counts.get(msg_key, 0) + 1
            record_prediction_failure(str(session_id), str(exc), _retry_counts[msg_key])
            if _retry_counts[msg_key] >= MAX_RETRIES:
                logger.error(
                    "DLQ: max retries (%d) reached for session_id=%s; forwarding to dead-letter topic",
                    MAX_RETRIES,
                    session_id,
                )
                await _publish_dlq(msg.value)
                await _consumer.commit()
                _retry_counts.pop(msg_key, None)
                record_dlq(str(session_id))
            # Offset NOT committed on ordinary failure → message will be replayed.


async def stop_consumer() -> None:
    global _consumer, _consumer_task
    if _consumer_task is not None:
        _consumer_task.cancel()
        # Wait up to 30 s for any in-flight prediction to complete before forcing exit.
        done, pending = await asyncio.wait({_consumer_task}, timeout=30.0)
        if pending:
            logger.warning("Consumer task did not drain within 30 s; forcing stop")
        _consumer_task = None

    if _consumer is not None:
        await _consumer.stop()
        _consumer = None


def get_consumer_task() -> asyncio.Task | None:
    return _consumer_task
