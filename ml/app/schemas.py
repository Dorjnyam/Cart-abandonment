from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
import uuid

from pydantic import BaseModel, ConfigDict, Field


class FeatureVector(BaseModel):
    model_config = ConfigDict(frozen=True, protected_namespaces=())

    session_id: uuid.UUID
    tenant_id: uuid.UUID
    visitor_id: Optional[uuid.UUID] = None
    version: str
    features: Dict[str, Any]
    event_sequence: list[Any] = Field(default_factory=list)
    computed_at: datetime
    window_seconds: Optional[int] = None
    session_state: str = "NEW"
    has_purchase_success: bool = False
    has_checkout_start: bool = False
    has_cart_activity: bool = False
    final_event_type: str = ""


class PredictionOut(BaseModel):
    """Legacy prediction format (prediction_done topic)."""

    model_config = ConfigDict(frozen=True, protected_namespaces=())

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


class TopFeature(BaseModel):
    model_config = ConfigDict(frozen=True, protected_namespaces=())

    feature: str
    value: float = 0.0
    importance: float = 0.0


class PredictionResult(BaseModel):
    """Canonical thesis MVP prediction payload."""

    model_config = ConfigDict(frozen=True, protected_namespaces=())

    session_id: uuid.UUID
    tenant_id: uuid.UUID
    organization_id: uuid.UUID
    visitor_id: Optional[uuid.UUID] = None
    abandonment_probability: float = Field(ge=0.0, le=1.0)
    predicted_label: int
    predicted_class: PredictedClass
    model_name: str = "xgboost"
    model_version: str
    threshold: float
    top_features: list[TopFeature] = Field(default_factory=list)
    features: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime
    prediction_score: float = Field(ge=0.0, le=1.0)
    shap_values: Dict[str, float] = Field(default_factory=dict)
    xgb_score: float = Field(ge=0.0, le=1.0)
    lstm_score: Optional[float] = Field(default=None, ge=0.0, le=1.0)
    ensemble_method: str = "xgb_only"
    session_state: str = "NEW"
    has_purchase_success: bool = False
    has_checkout_start: bool = False
    has_cart_activity: bool = False
    final_event_type: str = ""
    event_sequence: list[Any] = Field(default_factory=list)

    @property
    def timestamp(self) -> datetime:
        return self.created_at
