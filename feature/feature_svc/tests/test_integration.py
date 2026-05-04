import asyncio
import math
from datetime import datetime, timezone
from uuid import uuid4

import pytest

from features import FeatureComputer
from models import SessionEnriched


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
