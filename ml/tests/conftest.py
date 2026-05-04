"""Shared fixtures — all tests use mocked models; no real .pkl/.pt files needed."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.schemas import FeatureVector


def make_fv(**overrides) -> FeatureVector:
    defaults = dict(
        session_id=uuid.uuid4(),
        tenant_id=uuid.uuid4(),
        visitor_id=uuid.uuid4(),
        version="v1",
        features={
            "session_duration_sec": 120.0,
            "page_view_count": 3.0,
            "cart_item_count": 1.0,
            "event_count": 10.0,
        },
        event_sequence=[1.0, 2.0, 3.0, 4.0, 5.0],
        computed_at=datetime.now(timezone.utc),
        window_seconds=300,
    )
    defaults.update(overrides)
    return FeatureVector(**defaults)


@pytest.fixture
def feature_vector():
    return make_fv()


@pytest.fixture
def mock_xgb_predict():
    """Patch XGBoostModel.predict_with_shap to return a fixed score + SHAP dict."""
    with patch(
        "app.xgboost_model.XGBoostModel.predict_with_shap",
        return_value=(0.72, {"session_duration_sec": 0.35, "page_view_count": -0.12}),
    ) as m:
        yield m


@pytest.fixture
def mock_lstm_predict():
    """Patch LSTMModel.predict_score to return a fixed score."""
    with patch(
        "app.lstm_model.LSTMModel.predict_score",
        return_value=0.65,
    ) as m:
        yield m


@pytest.fixture
def mock_kafka_producer():
    """Patch the AIOKafkaProducer so no real Kafka connection is made."""
    producer = MagicMock()
    producer.send_and_wait = AsyncMock(return_value=None)
    with patch("app.producer._producer", producer):
        yield producer
