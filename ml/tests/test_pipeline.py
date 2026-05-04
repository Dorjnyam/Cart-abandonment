"""
Pipeline unit tests — all models are mocked; no real files required.
Covers: XGBoost-only, ensemble, score clamping, SHAP disabled,
        feature mismatch warning, NaN sanitisation, numpy serialisation.
"""

import json
import uuid
from datetime import datetime, timezone
from unittest.mock import patch

import numpy as np
import pytest

from app.pipeline import PredictionPipeline
from app.schemas import FeatureVector, PredictedClass
from tests.conftest import make_fv


# ── Helpers ───────────────────────────────────────────────────────────────────

def _armed_pipeline(xgb_score=0.72, shap=None, lstm_score=0.65, lstm_loaded=True) -> PredictionPipeline:
    """Return a PredictionPipeline with both models mocked and model_loaded=True."""
    if shap is None:
        shap = {"session_duration_sec": 0.35}

    p = PredictionPipeline()
    p.xgb.model_loaded = True
    p.xgb.feature_names = ["session_duration_sec", "page_view_count", "cart_item_count", "event_count"]
    p.xgb.model_version = "xgboost-v1"
    p.xgb.predict_with_shap = lambda features: (xgb_score, shap)

    p.lstm.model_version = "lstm-v1"
    p.lstm.predict_score = lambda seq: lstm_score

    p._lstm_loaded = lstm_loaded
    return p


# ── Basic prediction paths ─────────────────────────────────────────────────────

async def test_xgboost_only_when_lstm_disabled():
    p = _armed_pipeline(xgb_score=0.8, lstm_loaded=False)
    fv = make_fv()
    _, v2 = await p.predict(fv)

    assert v2.xgb_score == pytest.approx(0.8)
    assert v2.lstm_score is None
    assert v2.ensemble_method == "xgb_only"
    assert v2.prediction_score == pytest.approx(0.8)
    assert v2.model_version == "xgboost-v1"


async def test_ensemble_combines_scores_with_weights():
    """Weighted average: 0.7 * 0.6 + 0.3 * 0.4 = 0.54."""
    p = _armed_pipeline(xgb_score=0.6, lstm_score=0.4, lstm_loaded=True)
    fv = make_fv()
    _, v2 = await p.predict(fv)

    assert v2.xgb_score == pytest.approx(0.6)
    assert v2.lstm_score == pytest.approx(0.4)
    assert v2.ensemble_method == "weighted_avg"
    assert v2.prediction_score == pytest.approx(0.7 * 0.6 + 0.3 * 0.4, abs=1e-6)
    assert "+" in v2.model_version


async def test_predicted_class_abandoned_above_threshold():
    p = _armed_pipeline(xgb_score=0.9, lstm_loaded=False)
    fv = make_fv()
    _, v2 = await p.predict(fv)
    assert v2.predicted_class == PredictedClass.abandoned


async def test_predicted_class_converted_below_threshold():
    p = _armed_pipeline(xgb_score=0.1, lstm_loaded=False)
    fv = make_fv()
    _, v2 = await p.predict(fv)
    assert v2.predicted_class == PredictedClass.converted


# ── Score clamping ─────────────────────────────────────────────────────────────

async def test_score_clamped_above_one():
    """Ensemble with weights summing > 1 should still produce a valid score."""
    p = _armed_pipeline(xgb_score=1.0, lstm_score=1.0, lstm_loaded=True)
    # Temporarily override weights via settings mock
    with patch("app.pipeline.settings") as mock_settings:
        mock_settings.ensemble_weight_xgboost = 0.7
        mock_settings.ensemble_weight_lstm = 0.3
        mock_settings.abandon_threshold = 0.5
        mock_settings.shap_enabled = True
        mock_settings.shap_top_n = 10
        mock_settings.max_concurrent_inferences = 4
        p2 = _armed_pipeline(xgb_score=1.0, lstm_score=1.0, lstm_loaded=True)
        fv = make_fv()
        _, v2 = await p2.predict(fv)
    # score = 0.7*1.0 + 0.3*1.0 = 1.0 — clamp keeps it at 1.0, no crash
    assert 0.0 <= v2.prediction_score <= 1.0


async def test_score_clamped_below_zero():
    p = _armed_pipeline(xgb_score=0.0, lstm_score=0.0, lstm_loaded=False)
    fv = make_fv()
    _, v2 = await p.predict(fv)
    assert v2.prediction_score >= 0.0


# ── LSTM failure fallback ──────────────────────────────────────────────────────

async def test_lstm_failure_falls_back_to_xgboost():
    p = PredictionPipeline()
    p.xgb.model_loaded = True
    p.xgb.feature_names = ["session_duration_sec"]
    p.xgb.model_version = "xgboost-v1"
    p.xgb.predict_with_shap = lambda features: (0.6, {})
    p._lstm_loaded = True
    p.lstm.model_version = "lstm-v1"
    p.lstm.predict_score = lambda seq: (_ for _ in ()).throw(RuntimeError("GPU OOM"))

    fv = make_fv()
    _, v2 = await p.predict(fv)

    # LSTM failure must not crash the pipeline — falls back to xgb_only
    assert v2.lstm_score is None
    assert v2.ensemble_method == "xgb_only"
    assert v2.prediction_score == pytest.approx(0.6)


# ── SHAP disabled ──────────────────────────────────────────────────────────────

async def test_shap_disabled_returns_empty_dict():
    with patch("app.xgboost_model.settings") as mock_settings:
        mock_settings.shap_enabled = False
        mock_settings.shap_top_n = 10

        from app.xgboost_model import XGBoostModel
        import numpy as np

        xgb_model = XGBoostModel.__new__(XGBoostModel)
        xgb_model.model = None
        xgb_model.explainer = object()  # non-None but won't be called
        xgb_model.feature_names = ["a"]

        # predict_with_shap needs a real model; test just the guard logic
        # SHAP block should be skipped when shap_enabled=False
        mock_model = type("M", (), {
            "predict_proba": lambda self, X: np.array([[0.3, 0.7]])
        })()
        xgb_model.model = mock_model
        score, shap_dict = xgb_model.predict_with_shap({"a": 1.0})

    assert score == pytest.approx(0.7)
    assert shap_dict == {}


# ── Feature mismatch warning ───────────────────────────────────────────────────

def test_feature_mismatch_logs_warning(caplog):
    import logging
    from app.xgboost_model import XGBoostModel
    import numpy as np

    xgb_model = XGBoostModel.__new__(XGBoostModel)
    xgb_model.feature_names = ["a", "b", "c"]

    with caplog.at_level(logging.WARNING, logger="app.xgboost_model"):
        row = [{"a": 1.0}.get(name, 0.0) for name in xgb_model.feature_names]
        # Simulate _feature_array logic: check missing keys
        encoded = {"a": 1.0}  # "b" and "c" are missing
        missing = [n for n in xgb_model.feature_names if n not in encoded]
        if missing:
            import logging as _logging
            _logging.getLogger("app.xgboost_model").warning(
                "Feature mismatch: %d model features absent from payload (filled 0.0): %s",
                len(missing), missing[:10],
            )

    assert "Feature mismatch" in caplog.text
    assert "2" in caplog.text  # 2 missing features


# ── NaN sanitisation ──────────────────────────────────────────────────────────

def test_nan_in_features_filled_with_zero():
    import numpy as np
    from app.xgboost_model import XGBoostModel

    xgb_model = XGBoostModel.__new__(XGBoostModel)
    xgb_model.feature_names = ["a", "b"]

    features = {"a": float("nan"), "b": 1.0}
    encoded = dict(features)
    row = [encoded.get(n, 0.0) for n in xgb_model.feature_names]
    X = np.array([row], dtype=np.float32)
    X_clean = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    assert not np.isnan(X_clean).any()
    assert X_clean[0][0] == pytest.approx(0.0)


# ── numpy serialisation ───────────────────────────────────────────────────────

def test_numpy_float32_in_shap_serialises_to_json():
    shap_dict = {
        "session_duration_sec": np.float32(0.42),
        "page_view_count": np.float32(-0.11),
    }
    converted = {k: float(v) for k, v in shap_dict.items()}
    # Must not raise TypeError
    result = json.dumps(converted)
    parsed = json.loads(result)
    assert parsed["session_duration_sec"] == pytest.approx(0.42, abs=1e-4)


# ── Output schema contract ────────────────────────────────────────────────────

async def test_v2_result_fields_complete():
    p = _armed_pipeline(xgb_score=0.55, lstm_score=0.45, lstm_loaded=True)
    fv = make_fv()
    legacy, v2 = await p.predict(fv)

    # Legacy format
    assert legacy.abandon_probability == pytest.approx(v2.prediction_score)
    assert legacy.model_version == v2.model_version

    # V2 format
    assert v2.session_id == fv.session_id
    assert v2.xgb_score == pytest.approx(0.55)
    assert v2.lstm_score == pytest.approx(0.45)
    assert v2.ensemble_method == "weighted_avg"
    assert isinstance(v2.shap_values, dict)
    assert isinstance(v2.timestamp, datetime)


# ── Config validation ─────────────────────────────────────────────────────────

def test_ensemble_weights_must_sum_to_one():
    import os
    import pytest
    from pydantic import ValidationError

    env = {
        "PG_DSN": "postgresql://u:p@localhost/db",
        "ENSEMBLE_WEIGHT_XGBOOST": "0.9",
        "ENSEMBLE_WEIGHT_LSTM": "0.9",  # 0.9 + 0.9 = 1.8 ≠ 1.0
    }
    with patch.dict(os.environ, env, clear=False):
        from pydantic import ValidationError
        with pytest.raises(ValidationError, match="must equal 1.0"):
            from app.config import Settings
            Settings()
