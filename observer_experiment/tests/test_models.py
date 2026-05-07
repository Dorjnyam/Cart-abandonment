"""
Unit tests for EventPayload (Pydantic model) and tier allowlist logic.

No HTTP or I/O — pure model validation.
"""

import pytest
from datetime import datetime, timezone

from observer.models.payload import EventPayload
from observer.models.event import (
    CORE_DB_KEYS,
    filter_payload_for_tier,
    normalize_incoming_keys,
    tier_from_key_prefix,
)


# ── tier_from_key_prefix ───────────────────────────────────────────────────

def test_tier_prefix_t3():
    assert tier_from_key_prefix("tk_basic_abc") == "T3"

def test_tier_prefix_t2():
    assert tier_from_key_prefix("tk_smart_abc") == "T2"

def test_tier_prefix_t1():
    assert tier_from_key_prefix("tk_full_abc") == "T1"

def test_tier_prefix_invalid():
    assert tier_from_key_prefix("tk_other_abc") is None

def test_tier_prefix_empty():
    assert tier_from_key_prefix("") is None

def test_tier_prefix_none():
    assert tier_from_key_prefix(None) is None


# ── event_id in CORE_DB_KEYS ───────────────────────────────────────────────

def test_event_id_is_core_key():
    assert "event_id" in CORE_DB_KEYS, (
        "event_id must be in CORE_DB_KEYS so it survives tier filtering (idempotency)"
    )


def test_tenant_id_is_core_key():
    assert "tenant_id" in CORE_DB_KEYS, (
        "tenant_id must survive tier filtering so Session can route events to the tenant"
    )


# ── filter_payload_for_tier ────────────────────────────────────────────────

def test_event_id_survives_t3_filter():
    data = {
        "event_id": "evt_123",
        "visitor_id": "v1",
        "session_id": "s1",
        "event_type": "page_view",
    }
    result = filter_payload_for_tier(data, "T3")
    assert result["event_id"] == "evt_123"


def test_tenant_id_survives_t3_filter():
    tenant_id = "00000000-0000-0000-0000-000000000001"
    data = {
        "tenant_id": tenant_id,
        "visitor_id": "v1",
        "session_id": "s1",
        "event_type": "page_view",
    }
    result = filter_payload_for_tier(data, "T3")
    assert result["tenant_id"] == tenant_id


def test_t1_field_stripped_in_t3():
    data = {"visitor_id": "v1", "cart_value": 50.0, "cart_item_count": 3}
    result = filter_payload_for_tier(data, "T3")
    assert "cart_value" not in result
    assert "cart_item_count" not in result


def test_t1_field_allowed_in_t1():
    data = {"visitor_id": "v1", "cart_value": 50.0}
    result = filter_payload_for_tier(data, "T1")
    assert result["cart_value"] == 50.0


def test_checkout_error_preserves_error_type_and_step():
    result = filter_payload_for_tier(
        {
            "visitor_id": "v1",
            "event_type": "checkout_error",
            "checkout_step": "payment",
            "error_type": "payment_failed",
        },
        "T1",
    )
    assert result["checkout_step"] == "payment"
    assert result["error_type"] == "payment_failed"


def test_purchase_success_preserves_order_fields():
    result = filter_payload_for_tier(
        {
            "visitor_id": "v1",
            "event_type": "purchase_success",
            "order_id": "order-1",
            "payment_method": "card",
            "cart_total": 250.0,
        },
        "T1",
    )
    assert result["order_id"] == "order-1"
    assert result["payment_method"] == "card"
    assert result["cart_total"] == 250.0


def test_price_sensitive_fields_and_unknown_t1_are_preserved():
    result = filter_payload_for_tier(
        {
            "visitor_id": "v1",
            "shipping_cost": 25.0,
            "discount": 0,
            "cart_total": 425.0,
            "coupon_failed": True,
        },
        "T1",
    )
    assert result["shipping_cost"] == 25.0
    assert result["discount"] == 0
    assert result["cart_total"] == 425.0
    assert result["coupon_failed"] is True


def test_t2_extra_allowed_in_t2():
    data = {"visitor_id": "v1", "js_error": 2, "rage_click": 1}
    result = filter_payload_for_tier(data, "T2")
    assert result["js_error"] == 2
    assert result["rage_click"] == 1


def test_t2_extra_stripped_in_t3():
    data = {"visitor_id": "v1", "js_error": 2}
    result = filter_payload_for_tier(data, "T3")
    assert "js_error" not in result


def test_forbidden_keys_stripped_in_all_tiers():
    for tier in ("T1", "T2", "T3"):
        data = {
            "visitor_id": "v1",
            "password": "hunter2",
            "token": "tok",
            "api_key": "key",
            "secret": "shhh",
        }
        result = filter_payload_for_tier(data, tier)
        for key in ("password", "token", "api_key", "secret"):
            assert key not in result, f"{key!r} not stripped in tier {tier}"


# ── normalize_incoming_keys (aliases) ────────────────────────────────────

def test_alias_likely_logged_in():
    result = normalize_incoming_keys({"likely_logged_in": True})
    assert result.get("is_logged_in") is True
    assert "likely_logged_in" not in result


def test_alias_js_error_count():
    result = normalize_incoming_keys({"js_error_count": 5})
    assert result.get("js_error") == 5
    assert "js_error_count" not in result


def test_ca_user_known_field_mapped():
    result = normalize_incoming_keys({"ca_user_is_logged_in": True})
    assert result.get("is_logged_in") is True


def test_ca_user_unknown_field_dropped():
    result = normalize_incoming_keys({"ca_user_unknown_field": "foo"})
    assert "ca_user_unknown_field" not in result


# ── EventPayload construction ──────────────────────────────────────────────

def test_basic_payload_creation():
    tenant_id = "00000000-0000-0000-0000-000000000001"
    p = EventPayload(
        visitor_id="vis_abc",
        session_id="sess_12345678",
        tenant_id=tenant_id,
        event_type="page_view",
        url="https://example.com",
        tier="T3",
    )
    assert p.visitor_id == "vis_abc"
    assert p.tenant_id == tenant_id
    assert p.tier == "T3"


def test_timestamp_coercion_iso_string():
    p = EventPayload(timestamp="2024-01-15T12:00:00Z")
    assert isinstance(p.timestamp, datetime)
    assert p.timestamp.year == 2024


def test_timestamp_coercion_epoch_ms():
    p = EventPayload(timestamp=1705316400000)
    assert isinstance(p.timestamp, datetime)


def test_timestamp_coercion_epoch_s():
    p = EventPayload(timestamp=1705316400.0)
    assert isinstance(p.timestamp, datetime)


def test_invalid_timestamp_raises():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        EventPayload(timestamp="not-a-date-at-all-xyz")


def test_session_id_too_short_raises():
    from pydantic import ValidationError
    with pytest.raises(ValidationError):
        EventPayload(session_id="short")


def test_session_id_8_chars_accepted():
    p = EventPayload(session_id="abcdefgh")
    assert p.session_id == "abcdefgh"


def test_to_ingest_dict_excludes_none():
    p = EventPayload(
        visitor_id="vis_abc",
        session_id="sess_12345678",
        event_type="page_view",
        tier="T3",
    )
    d = p.to_ingest_dict()
    # None fields must not appear in the output dict
    for k, v in d.items():
        assert v is not None, f"Field {k!r} was None in to_ingest_dict output"


def test_to_ingest_dict_serialises_datetime():
    p = EventPayload(timestamp="2024-06-01T00:00:00Z")
    d = p.to_ingest_dict()
    assert isinstance(d["timestamp"], str)
    assert "2024" in d["timestamp"]


def test_tier_field_filtered_payload():
    """When tier is set, T1 fields must be stripped for T3 payloads via the model_validator."""
    p = EventPayload(
        visitor_id="v1",
        session_id="sess_12345678",
        event_type="page_view",
        cart_value=100.0,
        tier="T3",
    )
    d = p.to_ingest_dict()
    assert "cart_value" not in d
