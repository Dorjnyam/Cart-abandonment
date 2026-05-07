from __future__ import annotations

import asyncio
import json
import logging
import math

from aiokafka import AIOKafkaProducer

logger = logging.getLogger(__name__)

from config import BASELINE_FIELDS, EXTENDED_FIELDS, FEATURE_READY_TOPIC, FEATURE_SET, KAFKA_BOOTSTRAP
from models import FeatureVector

_producer: AIOKafkaProducer | None = None


def _json_default(obj: object) -> object:
    """JSON serializer fallback: replace NaN/Inf floats with 0.0; reject everything else."""
    if isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return 0.0
    raise TypeError(f"Object of type {type(obj).__name__} is not JSON serializable")


async def get_producer() -> AIOKafkaProducer:
    global _producer
    if _producer is None:
        _producer = AIOKafkaProducer(
            bootstrap_servers=KAFKA_BOOTSTRAP,
            acks="all",
            enable_idempotence=True,
            value_serializer=lambda v: json.dumps(v, default=_json_default).encode(),
        )
        await _producer.start()
    return _producer


async def emit_feature_vector(fv: FeatureVector) -> None:
    producer = await get_producer()
    data = fv.model_dump(mode="json")

    # Ablation study: filter emitted fields based on FEATURE_SET env var
    if FEATURE_SET == "baseline":
        data["features"] = {k: v for k, v in data["features"].items() if k in BASELINE_FIELDS}
    elif FEATURE_SET == "extended":
        data["features"] = {k: v for k, v in data["features"].items() if k in EXTENDED_FIELDS}
    # "full" → emit all 76 fields unchanged

    for attempt in range(3):
        try:
            await producer.send_and_wait(
                FEATURE_READY_TOPIC,
                value=data,
                key=str(fv.session_id).encode(),
            )
            return
        except Exception as exc:
            if attempt < 2:
                await asyncio.sleep(1)
            else:
                raise RuntimeError(
                    f"Failed to emit feature vector after 3 attempts: {exc}"
                ) from exc


async def close_producer() -> None:
    global _producer
    if _producer is not None:
        await _producer.stop()
        _producer = None
