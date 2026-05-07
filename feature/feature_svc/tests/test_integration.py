import asyncio
import json
import math
from datetime import datetime, timezone
from uuid import uuid4

import pytest

from features import FeatureComputer
from models import AggregatedFields, SessionEnriched


def test_aggregated_null_values_use_defaults() -> None:
    fields = AggregatedFields(
        time_on_page_sec=None,
        max_scroll_pct=None,
        click_count=None,
        rage_click=None,
        end_reason=None,
    )

    assert fields.time_on_page_sec == 0.0
    assert fields.max_scroll_pct == 0.0
    assert fields.click_count == 0
    assert fields.rage_click == 0
    assert fields.end_reason == ""


def test_aggregated_numeric_strings_are_coerced() -> None:
    fields = AggregatedFields(
        checkout_step_detected="0.0",
        max_scroll_pct="45.5",
        is_order_success="false",
    )

    assert fields.checkout_step_detected == 0
    assert fields.max_scroll_pct == pytest.approx(45.5)
    assert fields.is_order_success is False


def test_feature_vector_model_dump_json_is_serializable() -> None:
    session = SessionEnriched(
        session_id=uuid4(),
        visitor_id=uuid4(),
        tenant_id=uuid4(),
        started_at=datetime(2026, 3, 15, 14, 30, tzinfo=timezone.utc),
        window_seconds=30,
        aggregated_fields={"cart_item_count": 1},
        event_sequence=[],
    )

    fv = asyncio.run(FeatureComputer("1.0.0", "C").compute(session))
    json.dumps(fv.model_dump(mode="json"))


def test_feature_vector_carries_outcome_metadata_outside_features() -> None:
    session = SessionEnriched(
        session_id=uuid4(),
        visitor_id=uuid4(),
        tenant_id=uuid4(),
        started_at=datetime(2026, 3, 15, 14, 30, tzinfo=timezone.utc),
        window_seconds=None,
        session_state="CONVERTED",
        has_purchase_success=True,
        has_checkout_start=True,
        has_cart_activity=True,
        final_event_type="purchase_success",
        aggregated_fields={"is_order_success": True, "cart_item_count": 1},
        event_sequence=["page_view", "purchase_success"],
    )

    fv = asyncio.run(FeatureComputer("1.0.0", "C").compute(session))

    assert fv.session_state == "CONVERTED"
    assert fv.has_purchase_success is True
    assert fv.has_checkout_start is True
    assert fv.has_cart_activity is True
    assert fv.final_event_type == "purchase_success"


def test_full_feature_vector() -> None:
    session = SessionEnriched(
        session_id=uuid4(),
        visitor_id=uuid4(),
        tenant_id=uuid4(),
        started_at=datetime(2026, 3, 15, 14, 30, tzinfo=timezone.utc),
        window_seconds=None,
        aggregated_fields={
            "rage_click": 2,
            "back_navigation": 1,
            "js_error": 0,
            "cart_churn_count": 0,
            "selected_size": "L",
            "selected_quantity": 1,
            "form_fields_touched": 1,
            "checkout_step": 1,
            "payment_method": "card",
            "is_logged_in": False,
            "cart_abandoned_count": 2,
            "copy_count": 0,
            "tab_hidden_ms": 0,
            "outbound_click": 0,
            "cart_value": 100,
            "cart_item_count": 2,
        },
        event_sequence=[],
    )

    fv = asyncio.run(FeatureComputer("1.0.0", "C").compute(session))

    # Pydantic v2 — attribute access (not dict-style)
    assert fv.features.frustration_index == pytest.approx(0.35 * 2 + 0.30 * 1, abs=0.001)
    assert fv.features.mongolian_trust_barrier == 1.0
    assert fv.features.hour_sin == pytest.approx(math.sin(2 * math.pi * 14 / 24), abs=0.001)

    # Raw fields must NOT be overwritten by computed values
    assert fv.features.rage_click == 2
    assert fv.features.cart_churn_count == 0

    # New thesis-required fields
    assert fv.features.mouse_distance == 0.0          # no mouse events
    assert fv.features.cart_abandonment_signal is True  # cart_item_count=2, not purchased
    assert fv.features.time_to_first_action_ms == 0.0  # no events

    # Temporal encoding correct
    assert fv.features.hour_cos == pytest.approx(math.cos(2 * math.pi * 14 / 24), abs=0.001)
