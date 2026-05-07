import asyncio
from datetime import datetime

import pytest

from app.pipeline import PredictionPipeline
from app.schemas import PredictedClass
from tests.conftest import make_fv


def run(coro):
    return asyncio.run(coro)


def _armed_pipeline(xgb_score=0.72, shap=None) -> PredictionPipeline:
    if shap is None:
        shap = {"rage_click": 0.35}
    p = PredictionPipeline()
    p.xgb.model_loaded = True
    p.xgb.feature_names = ["rage_click", "page_load_ms", "cart_value"]
    p.xgb.model_version = "xgboost-test"
    p.xgb.predict_with_shap = lambda features: (xgb_score, shap)
    return p


def test_xgboost_only_prediction_contract():
    p = _armed_pipeline(xgb_score=0.8)
    fv = make_fv()
    legacy, result = run(p.predict(fv))

    assert legacy.abandon_probability == pytest.approx(0.8)
    assert result.abandonment_probability == pytest.approx(0.8)
    assert result.prediction_score == pytest.approx(0.8)
    assert result.predicted_label == 1
    assert result.predicted_class == PredictedClass.abandoned
    assert result.model_name == "xgboost"
    assert result.model_version == "xgboost-test"
    assert result.tenant_id == fv.tenant_id
    assert result.organization_id == fv.tenant_id
    assert result.features == fv.features
    assert result.lstm_score is None
    assert result.ensemble_method == "xgb_only"
    assert result.top_features[0].feature == "rage_click"
    assert isinstance(result.created_at, datetime)


def test_predicted_class_converted_below_threshold():
    p = _armed_pipeline(xgb_score=0.1)
    _, result = run(p.predict(make_fv()))
    assert result.predicted_class == PredictedClass.converted
    assert result.predicted_label == 0


def test_prediction_result_passes_business_metadata_through():
    p = _armed_pipeline(xgb_score=0.8)
    fv = make_fv(
        session_state="CONVERTED",
        has_purchase_success=True,
        has_checkout_start=True,
        has_cart_activity=True,
        final_event_type="purchase_success",
    )
    _, result = run(p.predict(fv))

    assert result.predicted_class == PredictedClass.abandoned
    assert result.session_state == "CONVERTED"
    assert result.has_purchase_success is True
    assert result.final_event_type == "purchase_success"


def test_score_is_clamped_to_valid_probability():
    p = _armed_pipeline(xgb_score=1.2)
    _, result = run(p.predict(make_fv()))
    assert result.abandonment_probability == pytest.approx(1.0)


def test_feature_order_missing_values_are_safe():
    from app.xgboost_model import XGBoostModel

    model = XGBoostModel.__new__(XGBoostModel)
    model.feature_names = ["a", "b"]
    row = [{"a": 1.0}.get(name, 0.0) for name in model.feature_names]
    assert row == [1.0, 0.0]
