from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class FeatureVector(BaseModel):
    model_config = ConfigDict(frozen=True)

    session_id: uuid.UUID
    tenant_id: uuid.UUID
    visitor_id: Optional[uuid.UUID] = None
    version: str
    features: Dict[str, Any]
    event_sequence: list[float] = Field(default_factory=list)
    computed_at: datetime
    window_seconds: Optional[int] = None


class PredictionOut(BaseModel):
    """Legacy prediction format (prediction_done topic)."""

    model_config = ConfigDict(frozen=True)

    session_id: uuid.UUID
    tenant_id: uuid.UUID
    window_seconds: Optional[int]
    abandon_probability: float = Field(ge=0.0, le=1.0)
    diagnosis_category: str
    shap_values: Dict[str, float]
    model_version: str
    predicted_at: datetime


class PredictedClass(str, Enum):
    abandoned = "abandoned"
    converted = "converted"


class PredictionResult(BaseModel):
    """V2 prediction format (prediction_done_v2 topic)."""

    model_config = ConfigDict(frozen=True)

    session_id: uuid.UUID
    visitor_id: Optional[uuid.UUID] = None
    prediction_score: float = Field(ge=0.0, le=1.0)
    predicted_class: PredictedClass
    shap_values: Dict[str, float]
    model_version: str
    timestamp: datetime
    xgb_score: float = Field(ge=0.0, le=1.0)
    lstm_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    ensemble_method: str = "xgb_only"
