from __future__ import annotations

import os
from pathlib import Path


def _load_local_env() -> None:
    env_path = Path(__file__).with_name(".env")
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


_load_local_env()

KAFKA_BOOTSTRAP = os.getenv("KAFKA_BOOTSTRAP", "kafka:9092")
SESSION_ENRICHED_TOPIC = os.getenv("SESSION_ENRICHED_TOPIC", "session_enriched")
FEATURE_READY_TOPIC = os.getenv("FEATURE_READY_TOPIC", "feature_ready")
FEATURE_CONSUMER_GROUP = os.getenv("FEATURE_CONSUMER_GROUP", "feature-svc-group")

FEATURE_VERSION = os.getenv("FEATURE_VERSION", "1.0.0")
FEATURE_VARIANT = os.getenv("FEATURE_VARIANT", "C")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
PORT = int(os.getenv("PORT", "8003"))

# Ablation study: baseline (9) | extended (~29) | full (all 71)
FEATURE_SET = os.getenv("FEATURE_SET", "full")

# Configurable thresholds (override via env vars)
QUARTILE_BOUNDARIES: tuple[float, float, float] = tuple(  # type: ignore[assignment]
    float(x) for x in os.getenv("QUARTILE_BOUNDARIES", "50.0,150.0,300.0").split(",")
)
assert len(QUARTILE_BOUNDARIES) == 3, (
    "QUARTILE_BOUNDARIES must have exactly 3 comma-separated float values"
)
HEDONIC_CATEGORIES: frozenset[str] = frozenset(
    os.getenv("HEDONIC_CATEGORIES", "fashion,beauty,electronics,toys,jewelry").split(",")
)
TRUSTED_PAYMENT_METHODS: frozenset[str] = frozenset(
    os.getenv("TRUSTED_PAYMENT_METHODS", "qpay,socialpay").split(",")
)
FRUSTRATION_WEIGHTS: tuple[float, float, float, float] = tuple(  # type: ignore[assignment]
    float(x) for x in os.getenv("FRUSTRATION_WEIGHTS", "0.35,0.30,0.20,0.15").split(",")
)
assert len(FRUSTRATION_WEIGHTS) == 4, (
    "FRUSTRATION_WEIGHTS must have exactly 4 comma-separated float values"
)

# Ablation study field sets
BASELINE_FIELDS: frozenset[str] = frozenset({
    "session_duration_sec",
    "page_view_count",
    "cart_item_count",
    "event_count",
    "device_type",
    "is_logged_in",
    "checkout_step_detected",
    "cart_churn_count",
    "is_mobile",
})

EXTENDED_FIELDS: frozenset[str] = BASELINE_FIELDS | frozenset({
    "rage_click",
    "max_scroll_pct",
    "active_time_ms",
    "mouse_distance",
    "time_on_page_sec",
    "cart_abandonment_signal",
    "time_to_first_action_ms",
    "page_load_ms",
    "payment_method",
    "product_availability",
    "selected_quantity",
    "avg_price_in_session",
    "frustration_index",
    "commitment_depth",
    "price_hesitation_score",
    "hedonic_ratio",
    "mongolian_trust_barrier",
    "dist_product_count",
    "hour_sin",
    "hour_cos",
    "is_mobile",
})
