import asyncio
import json
import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas import PredictedClass, PredictionOut, PredictionResult, TopFeature


def run(coro):
    return asyncio.run(coro)


def _make_legacy(session_id=None):
    session_id = session_id or uuid.uuid4()
    return PredictionOut(
        session_id=session_id,
        tenant_id=uuid.uuid4(),
        window_seconds=300,
        abandon_probability=0.75,
        diagnosis_category="abandoned",
        shap_values={"rage_click": 0.3},
        model_version="xgboost-v1",
        predicted_at=datetime.now(timezone.utc),
    )


def _make_result(session_id=None):
    session_id = session_id or uuid.uuid4()
    tenant_id = uuid.uuid4()
    return PredictionResult(
        session_id=session_id,
        tenant_id=tenant_id,
        organization_id=tenant_id,
        visitor_id=uuid.uuid4(),
        abandonment_probability=0.72,
        prediction_score=0.72,
        predicted_label=1,
        predicted_class=PredictedClass.abandoned,
        model_name="xgboost",
        model_version="xgboost-v1",
        threshold=0.5,
        top_features=[TopFeature(feature="rage_click", value=4, importance=0.3)],
        features={"rage_click": 4},
        created_at=datetime.now(timezone.utc),
        shap_values={"rage_click": 0.3},
        xgb_score=0.72,
    )


def test_publish_prediction_raises_after_3_failures():
    failing_producer = MagicMock()
    failing_producer.send_and_wait = AsyncMock(side_effect=Exception("broker down"))

    with patch("app.producer._producer", failing_producer):
        from app.producer import publish_prediction

        with pytest.raises(RuntimeError, match="Kafka publish failed after 3 attempts"):
            run(publish_prediction(_make_result()))


def test_publish_prediction_sends_canonical_payload():
    captured: list[dict] = []

    async def capture_send(topic, *, value, key):
        captured.append(value)

    ok_producer = MagicMock()
    ok_producer.send_and_wait = AsyncMock(side_effect=capture_send)
    result = _make_result()

    with patch("app.producer._producer", ok_producer):
        from app.producer import publish_prediction

        run(publish_prediction(result))

    payload = captured[0]
    assert payload["session_id"] == str(result.session_id)
    assert payload["tenant_id"] == str(result.tenant_id)
    assert payload["organization_id"] == str(result.organization_id)
    assert payload["abandonment_probability"] == pytest.approx(0.72)
    assert payload["predicted_label"] == 1
    assert payload["predicted_class"] == "abandoned"
    assert payload["model_name"] == "xgboost"
    assert payload["top_features"][0]["feature"] == "rage_click"
    assert payload["features"]["rage_click"] == 4
    json.dumps(payload)


def test_publish_uses_session_id_as_kafka_key():
    sid = uuid.uuid4()
    ok_producer = MagicMock()
    ok_producer.send_and_wait = AsyncMock(return_value=None)

    with patch("app.producer._producer", ok_producer):
        from app.producer import publish_prediction

        run(publish_prediction(_make_legacy(session_id=sid)))

    _, kwargs = ok_producer.send_and_wait.call_args
    assert kwargs["key"] == str(sid).encode()
