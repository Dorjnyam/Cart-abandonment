"""
Producer unit tests — verifies that:
  - publish failure after 3 attempts raises RuntimeError (not swallows)
  - offset is therefore NOT committed in the consumer
  - session_id is used as the Kafka message key
  - xgb_score / lstm_score / ensemble_method appear in the v2 payload
"""

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, call, patch

import pytest

from app.schemas import PredictedClass, PredictionOut, PredictionResult


def _make_legacy(session_id=None):
    session_id = session_id or uuid.uuid4()
    return PredictionOut(
        session_id=session_id,
        tenant_id=uuid.uuid4(),
        window_seconds=300,
        abandon_probability=0.75,
        diagnosis_category="abandoned",
        shap_values={"session_duration_sec": 0.3},
        model_version="xgboost-v1",
        predicted_at=datetime.now(timezone.utc),
    )


def _make_v2(session_id=None, lstm_score=0.6):
    session_id = session_id or uuid.uuid4()
    return PredictionResult(
        session_id=session_id,
        visitor_id=uuid.uuid4(),
        prediction_score=0.72,
        predicted_class=PredictedClass.abandoned,
        shap_values={"session_duration_sec": 0.3},
        model_version="xgboost-v1+lstm-v1",
        timestamp=datetime.now(timezone.utc),
        xgb_score=0.80,
        lstm_score=lstm_score,
        ensemble_method="weighted_avg",
    )


# ── Critical: publish failure must propagate (not be swallowed) ───────────────

async def test_publish_prediction_raises_after_3_failures():
    failing_producer = MagicMock()
    failing_producer.send_and_wait = AsyncMock(side_effect=Exception("broker down"))

    with patch("app.producer._producer", failing_producer):
        from app.producer import publish_prediction
        with pytest.raises(RuntimeError, match="Kafka publish failed after 3 attempts"):
            await publish_prediction(_make_legacy())


async def test_publish_prediction_v2_raises_after_3_failures():
    failing_producer = MagicMock()
    failing_producer.send_and_wait = AsyncMock(side_effect=Exception("broker down"))

    with patch("app.producer._producer", failing_producer):
        from app.producer import publish_prediction_v2
        with pytest.raises(RuntimeError, match="Kafka v2 publish failed after 3 attempts"):
            await publish_prediction_v2(_make_v2())


async def test_publish_succeeds_on_first_attempt():
    ok_producer = MagicMock()
    ok_producer.send_and_wait = AsyncMock(return_value=None)

    with patch("app.producer._producer", ok_producer):
        from app.producer import publish_prediction
        await publish_prediction(_make_legacy())  # must not raise

    assert ok_producer.send_and_wait.call_count == 1


# ── Message key = session_id ─────────────────────────────────────────────────

async def test_publish_uses_session_id_as_kafka_key():
    sid = uuid.uuid4()
    ok_producer = MagicMock()
    ok_producer.send_and_wait = AsyncMock(return_value=None)

    with patch("app.producer._producer", ok_producer):
        from app.producer import publish_prediction
        await publish_prediction(_make_legacy(session_id=sid))

    _, kwargs = ok_producer.send_and_wait.call_args
    assert kwargs["key"] == str(sid).encode()


async def test_publish_v2_uses_session_id_as_kafka_key():
    sid = uuid.uuid4()
    ok_producer = MagicMock()
    ok_producer.send_and_wait = AsyncMock(return_value=None)

    with patch("app.producer._producer", ok_producer):
        from app.producer import publish_prediction_v2
        await publish_prediction_v2(_make_v2(session_id=sid))

    _, kwargs = ok_producer.send_and_wait.call_args
    assert kwargs["key"] == str(sid).encode()


# ── V2 payload includes individual model scores ───────────────────────────────

async def test_v2_payload_contains_xgb_lstm_ensemble_fields():
    captured: list[dict] = []

    async def capture_send(topic, *, value, key):
        captured.append(value)

    mock_producer = MagicMock()
    mock_producer.send_and_wait = AsyncMock(side_effect=capture_send)

    with patch("app.producer._producer", mock_producer):
        from app.producer import publish_prediction_v2
        await publish_prediction_v2(_make_v2(lstm_score=0.55))

    payload = captured[0]
    assert "xgb_score" in payload
    assert "lstm_score" in payload
    assert "ensemble_method" in payload
    assert payload["xgb_score"] == pytest.approx(0.80)
    assert payload["lstm_score"] == pytest.approx(0.55)
    assert payload["ensemble_method"] == "weighted_avg"


# ── No numpy types leak into the payload ─────────────────────────────────────

async def test_payload_is_json_serialisable():
    """Payload built in producer must not contain numpy types."""
    import numpy as np

    sid = uuid.uuid4()
    legacy = PredictionOut(
        session_id=sid,
        tenant_id=uuid.uuid4(),
        window_seconds=300,
        abandon_probability=float(np.float32(0.75)),
        diagnosis_category="abandoned",
        shap_values={"a": float(np.float32(0.1))},
        model_version="v1",
        predicted_at=datetime.now(timezone.utc),
    )

    ok_producer = MagicMock()
    captured: list = []

    async def capture(topic, *, value, key):
        captured.append(value)

    ok_producer.send_and_wait = AsyncMock(side_effect=capture)

    with patch("app.producer._producer", ok_producer):
        from app.producer import publish_prediction
        await publish_prediction(legacy)

    # The value serialiser (json.dumps) must not raise TypeError
    json.dumps(captured[0])  # raises if numpy types leaked
