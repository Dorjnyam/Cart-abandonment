from __future__ import annotations

from collections import deque
from datetime import datetime, timezone
from typing import Any

MAX_RECENT_EVENTS = 80
MAX_RECENT_PREDICTIONS = 30
MAX_TOP_FEATURES = 8
MAX_FEATURE_SAMPLE = 18

_events: deque[dict[str, str]] = deque(maxlen=MAX_RECENT_EVENTS)
_predictions: deque[dict[str, Any]] = deque(maxlen=MAX_RECENT_PREDICTIONS)
_stats: dict[str, int] = {
    "messages_consumed": 0,
    "feature_vectors_validated": 0,
    "predictions_created": 0,
    "predictions_persisted": 0,
    "prediction_messages_published": 0,
    "failures": 0,
    "retries": 0,
    "dlq_messages": 0,
    "active_inferences": 0,
}
_last_feature_vector: dict[str, Any] | None = None
_last_prediction: dict[str, Any] | None = None
_last_error: dict[str, Any] | None = None


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def _json_safe(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if hasattr(value, "value"):
        return value.value
    if isinstance(value, dict):
        return {str(k): _json_safe(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_safe(v) for v in value]
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def _feature_sample(features: dict[str, Any]) -> dict[str, Any]:
    return {
        key: _json_safe(value)
        for key, value in list(features.items())[:MAX_FEATURE_SAMPLE]
    }


def record_event(message: str, level: str = "info") -> None:
    _events.appendleft({"at": _utc_now(), "level": level, "message": message})


def record_message_received(topic: str, partition: int, offset: int) -> None:
    _stats["messages_consumed"] += 1
    record_event(f"Kafka message received {topic}:{partition}:{offset}")


def record_feature_vector(fv: Any, *, topic: str, partition: int, offset: int) -> None:
    global _last_feature_vector

    features = dict(getattr(fv, "features", {}) or {})
    _stats["feature_vectors_validated"] += 1
    _last_feature_vector = {
        "received_at": _utc_now(),
        "topic": topic,
        "partition": partition,
        "offset": offset,
        "session_id": str(getattr(fv, "session_id", "")),
        "tenant_id": str(getattr(fv, "tenant_id", "")),
        "visitor_id": str(getattr(fv, "visitor_id", "")) if getattr(fv, "visitor_id", None) else None,
        "feature_version": str(getattr(fv, "version", "")),
        "computed_at": _json_safe(getattr(fv, "computed_at", None)),
        "window_seconds": getattr(fv, "window_seconds", None),
        "feature_count": len(features),
        "feature_sample": _feature_sample(features),
    }
    record_event(f"Feature vector validated for session {_last_feature_vector['session_id']}")


def increment_active_inference() -> None:
    _stats["active_inferences"] += 1


def decrement_active_inference() -> None:
    _stats["active_inferences"] = max(0, _stats["active_inferences"] - 1)


def record_prediction_success(fv: Any, prediction: Any) -> None:
    global _last_prediction

    top_features = []
    for item in list(getattr(prediction, "top_features", []) or [])[:MAX_TOP_FEATURES]:
        top_features.append(
            {
                "feature": getattr(item, "feature", ""),
                "value": _json_safe(getattr(item, "value", 0.0)),
                "importance": _json_safe(getattr(item, "importance", 0.0)),
            }
        )

    _stats["predictions_created"] += 1
    _stats["predictions_persisted"] += 1
    _stats["prediction_messages_published"] += 2
    _last_prediction = {
        "created_at": _json_safe(getattr(prediction, "created_at", None)),
        "session_id": str(getattr(prediction, "session_id", "")),
        "tenant_id": str(getattr(prediction, "tenant_id", "")),
        "visitor_id": str(getattr(fv, "visitor_id", "")) if getattr(fv, "visitor_id", None) else None,
        "feature_version": str(getattr(fv, "version", "")),
        "model_name": getattr(prediction, "model_name", "xgboost"),
        "model_version": getattr(prediction, "model_version", ""),
        "score": _json_safe(getattr(prediction, "abandonment_probability", 0.0)),
        "xgb_score": _json_safe(getattr(prediction, "xgb_score", 0.0)),
        "lstm_score": _json_safe(getattr(prediction, "lstm_score", None)),
        "threshold": _json_safe(getattr(prediction, "threshold", 0.0)),
        "predicted_label": getattr(prediction, "predicted_label", None),
        "predicted_class": _json_safe(getattr(prediction, "predicted_class", "")),
        "top_features": top_features,
    }
    _predictions.appendleft(dict(_last_prediction))
    record_event(
        "Prediction published for session "
        f"{_last_prediction['session_id']} score={float(_last_prediction['score']):.3f}"
    )


def record_prediction_failure(session_id: str, error: str, retry_count: int) -> None:
    global _last_error

    _stats["failures"] += 1
    _stats["retries"] += 1
    _last_error = {
        "at": _utc_now(),
        "session_id": session_id,
        "retry_count": retry_count,
        "error": error,
    }
    record_event(f"Prediction failed for session {session_id}; retry {retry_count}", level="error")


def record_dlq(session_id: str) -> None:
    _stats["dlq_messages"] += 1
    record_event(f"Message moved to DLQ for session {session_id}", level="error")


def snapshot() -> dict[str, Any]:
    return {
        "stats": dict(_stats),
        "last_feature_vector": _last_feature_vector,
        "last_prediction": _last_prediction,
        "last_error": _last_error,
        "recent_predictions": list(_predictions),
        "recent_events": list(_events),
    }
