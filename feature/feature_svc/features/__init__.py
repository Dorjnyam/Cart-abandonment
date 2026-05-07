from __future__ import annotations

import asyncio
import logging
import math
import os
from datetime import datetime, timezone
from typing import Any

from models import FeatureSet, FeatureVector, SessionEnriched

from .commitment import commitment_depth
from .frustration import frustration_index
from .hedonic import hedonic_ratio
from .mouse import compute_mouse_features
from .price import avg_price_in_session, price_hesitation_score
from .products import dist_product_count
from .raw_passthrough import extract_raw
from .temporal import sequence_behavior_features, temporal_features
from .trust import mongolian_trust_barrier

logger = logging.getLogger(__name__)

VARIANT_A_FIELDS = {
    "frustration_index",
    "commitment_depth",
    "price_hesitation_score",
    "hedonic_ratio",
    "mongolian_trust_barrier",
    "hour_sin",
    "hour_cos",
    "dow_sin",
    "dow_cos",
}

VARIANT_B_FIELDS = VARIANT_A_FIELDS | {
    "time_to_first_action_ms",
    "avg_price_in_session",
    "dist_product_count",
    "rage_click",
    "back_navigation",
    "js_error",
    "cart_churn_count",
    "selected_size",
    "selected_quantity",
    "form_fields_touched",
    "checkout_step",
    "copy_count",
    "tab_hidden_ms",
    "outbound_click",
    "cart_value",
    "payment_method",
    "is_logged_in",
    "cart_abandonment_signal",
}

VARIANT_D_GRAPH_FIELDS = {"motif_z1", "motif_z2", "motif_z3", "motif_z4", "entropy"}
FEATURE_FIELD_NAMES = tuple(FeatureSet.model_fields.keys())
EXPECTED_FEATURE_COUNT = 76
MAX_EVENTS_PER_SESSION = int(os.getenv("MAX_EVENTS_PER_SESSION", "10000"))


def _coerce_value_for_field(field_name: str, value: Any) -> Any:
    if value is None:
        return FeatureSet.model_fields[field_name].default
    annotation = FeatureSet.model_fields[field_name].annotation
    if annotation is str:
        return str(value)
    if annotation is bool:
        return bool(value)
    if annotation is int:
        try:
            return int(value)
        except (TypeError, ValueError):
            return 0
    if annotation is float:
        try:
            v = float(value)
            return 0.0 if (math.isnan(v) or math.isinf(v)) else v
        except (TypeError, ValueError):
            return 0.0
    return value


def _sanitize_payload(payload: dict[str, Any]) -> dict[str, Any]:
    for key, value in payload.items():
        if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
            payload[key] = 0.0
    return payload


class FeatureComputer:
    def __init__(self, version: str, variant: str = "C") -> None:
        self.version = version
        self.variant = (variant or "C").upper()

    async def _fetch_graph_features(self, session_id: str) -> dict[str, float | None]:
        try:
            import asyncpg
        except ImportError:
            logger.warning("asyncpg is not installed; graph features unavailable")
            return {}

        dsn = os.environ.get("GRAPH_DB_DSN")
        if not dsn:
            logger.warning("GRAPH_DB_DSN is not configured; graph features unavailable")
            return {}

        conn = await asyncpg.connect(dsn=dsn)
        try:
            row = await conn.fetchrow(
                """
                SELECT motif_z1, motif_z2, motif_z3, motif_z4, entropy
                FROM graph_features
                WHERE session_id = $1
                """,
                session_id,
            )
            if row is None:
                return {}
            return {key: row.get(key) for key in VARIANT_D_GRAPH_FIELDS}
        finally:
            await conn.close()

    def _filter_by_variant(self, features: dict[str, Any]) -> dict[str, Any]:
        if self.variant == "A":
            return {k: features.get(k) for k in VARIANT_A_FIELDS}
        if self.variant == "B":
            return {k: features.get(k) for k in VARIANT_B_FIELDS}
        return features

    def _compute_sync(self, session: SessionEnriched) -> dict[str, Any]:
        """CPU-bound feature computation — runs in a thread pool via asyncio.to_thread."""
        af = session.aggregated_fields
        evs = session.event_sequence or []
        evs = evs[:MAX_EVENTS_PER_SESSION]
        # Normalize events: convert string event_type names to dict format
        normalized_evs: list[dict[str, Any]] = []
        for e in evs:
            if isinstance(e, str):
                normalized_evs.append({"event_type": e})
            else:
                normalized_evs.append(e)
        evs = normalized_evs
        af_map = af.model_dump()

        # Start with raw passthrough values from aggregated_fields
        features: dict[str, Any] = extract_raw(af_map)

        # Computed features → their own dedicated fields (do NOT overwrite raw fields)
        features["frustration_index"] = frustration_index(af_map)
        features["commitment_depth"] = commitment_depth(af_map)
        features["price_hesitation_score"] = price_hesitation_score(af_map)
        features["hedonic_ratio"] = hedonic_ratio(evs, af_map) or 0.0
        features["mongolian_trust_barrier"] = mongolian_trust_barrier(af_map)
        features["avg_price_in_session"] = avg_price_in_session(evs)
        features["dist_product_count"] = dist_product_count(evs)

        # Temporal cyclic encoding + time_to_first_action_ms
        features.update(temporal_features(session.started_at, evs))

        # Sequence behavior: override scroll/click/time_on_page with event-derived values;
        # active_time_ms and page_load_ms stay as raw values from af_map
        behavior = sequence_behavior_features(evs)
        features["max_scroll_pct"] = behavior["scroll_depth_mean"]
        features["click_count"] = int(behavior["click_count_explicit"])
        features["time_on_page_sec"] = behavior["time_on_page_mean"]

        # Mouse tracking (feeds Visibility Graph service)
        mouse = compute_mouse_features(evs)
        features["mouse_distance"] = mouse["mouse_distance"]
        features["mouse_speed"] = mouse["mouse_speed"]
        features["direction_changes"] = mouse["direction_changes"]

        # Cart abandonment signal: items in cart but session ended without purchase
        features["cart_abandonment_signal"] = (
            int(af_map.get("cart_item_count", 0) or 0) > 0
            and not bool(af_map.get("is_order_success", False))
        )

        # event_count: emitter excludes it from aggregated_fields, derive from sequence length
        features["event_count"] = len(evs)

        # is_mobile: derived from device_type (canonical raw field)
        features["is_mobile"] = str(af_map.get("device_type") or "").lower() in ("mobile", "phone")

        return {"features": features, "af_map": af_map}

    async def compute(self, session: SessionEnriched) -> FeatureVector:
        # Offload all CPU-bound (Pandas/NumPy) work to a thread so the event loop
        # remains free for Kafka heartbeats and other coroutines.
        result = await asyncio.wait_for(
            asyncio.to_thread(self._compute_sync, session),
            timeout=30.0,
        )
        features: dict[str, Any] = result["features"]
        af_map: dict[str, Any] = result["af_map"]

        filtered = self._filter_by_variant(features)
        if self.variant == "D":
            graph_features = await self._fetch_graph_features(str(session.session_id))
            filtered = {**filtered, **graph_features}

        payload = FeatureSet().model_dump()
        for field in FEATURE_FIELD_NAMES:
            if field in filtered:
                payload[field] = _coerce_value_for_field(field, filtered[field])
            elif field in af_map:
                payload[field] = _coerce_value_for_field(field, af_map[field])

        payload = _sanitize_payload(payload)

        if len(payload) != EXPECTED_FEATURE_COUNT:
            raise ValueError(
                f"Feature count mismatch: expected {EXPECTED_FEATURE_COUNT}, got {len(payload)}"
            )

        return FeatureVector(
            session_id=session.session_id,
            tenant_id=session.tenant_id,
            version=self.version,
            variant=self.variant if self.variant in {"A", "B", "C", "D"} else "C",
            features=FeatureSet(**payload),
            computed_at=datetime.now(timezone.utc),
            window_seconds=session.window_seconds,
            session_state=session.session_state,
            has_purchase_success=session.has_purchase_success,
            has_checkout_start=session.has_checkout_start,
            has_cart_activity=session.has_cart_activity,
            final_event_type=session.final_event_type,
            event_sequence=session.event_sequence,
        )
