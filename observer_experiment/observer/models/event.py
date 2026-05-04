"""
Tier allowlists for JSONB payload keys (core DB columns are handled separately).

Strict schema: only keys listed per tier are stored. See README §2.1.
"""

from __future__ import annotations

from typing import Any

# Columns on raw_events — always kept when present (not subject to tier payload list).
CORE_DB_KEYS = frozenset(
    {
        "event_id",      # client-supplied dedup key — must survive tier filter
        "visitor_id",
        "session_id",
        "event_type",
        "url",
        "referrer",
        "timestamp",
        "ip",
        "user_agent",
    }
)

FORBIDDEN_KEYS = frozenset({"api_key", "authorization", "password", "token", "secret"})

ALIASES_TO_CANONICAL: dict[str, str] = {
    "likely_logged_in": "is_logged_in",
    "js_error_count": "js_error",
    "outbound_click_count": "outbound_click",
    "rage_click_bursts": "rage_click",
    "query": "search_query",
}

# Only mapped ca_user_* keys are merged; unknown ca_user_* are dropped in normalize.
CA_USER_FIELD_MAP: dict[str, str] = {
    "ca_user_customer_type": "customer_type",
    "ca_user_is_logged_in": "is_logged_in",
}

# --- Tier 3 (strict list; overlaps CORE for documentation — core keys always pass filter) ---
ALLOWED_T3: frozenset[str] = frozenset(
    {
        "visitor_id",
        "session_id",
        "visit_count",
        "url",
        "path",
        "referrer",
        "page_load_ms",
        "device_type",
        "language",
        "timezone",
        "time_on_page_sec",
        "max_scroll_pct",
        "scroll_up_count",
        "click_count",
        "active_time_ms",
        "tab_hidden_count",
        "tab_hidden_ms",
        "copy_count",
        "form_fields_count",
        "form_fields_touched",
        "bounce",
        "session_duration_sec",
        "is_logged_in",
        "customer_type",
    }
)

# Tier 2: T3 ∪ these (delta only below; union computed at bottom)
T2_EXTRA: frozenset[str] = frozenset(
    {
        "action_detected",
        "rage_click",
        "outbound_click",
        "detected_page_type",
        "product_slug",
        "checkout_step_detected",
        "search_query_from_url",
        "is_order_success",
        "product_id",
        "product_price",
        "product_category",
        "product_availability",
        "selected_size",
        "selected_quantity",
        "search_query",
        "filter_name",
        "coupon_entered",
        "js_error",
        "page_view_count",
        "back_navigation",
    }
)

# Tier 1: T2 ∪ these
T1_EXTRA: frozenset[str] = frozenset(
    {
        "cart_value",
        "cart_item_count",
        "checkout_step",
        "payment_method",
        "shipping_method",
        "order_total",
        "discount_code",
        "is_sale",
        "product_variant",
        "product_stock",
    }
)

ALLOWED_T2: frozenset[str] = ALLOWED_T3 | T2_EXTRA
ALLOWED_T1: frozenset[str] = ALLOWED_T2 | T1_EXTRA


def tier_from_key_prefix(key: str | None) -> str | None:
    if not key or not isinstance(key, str):
        return None
    if key.startswith("tk_full_"):
        return "T1"
    if key.startswith("tk_smart_"):
        return "T2"
    if key.startswith("tk_basic_"):
        return "T3"
    return None


def allowed_keys_for_tier(tier: str) -> frozenset[str]:
    if tier == "T1":
        return ALLOWED_T1
    if tier == "T2":
        return ALLOWED_T2
    return ALLOWED_T3


def normalize_incoming_keys(data: dict[str, Any]) -> dict[str, Any]:
    """Apply alias map and known ca_user_* → canonical; drop unknown ca_user_*."""
    out: dict[str, Any] = {}
    for k, v in data.items():
        if k in FORBIDDEN_KEYS:
            continue
        if k in CA_USER_FIELD_MAP:
            out[CA_USER_FIELD_MAP[k]] = v
            continue
        nk = ALIASES_TO_CANONICAL.get(k, k)
        if nk != k:
            out[nk] = v
            continue
        if k.startswith("ca_user_"):
            continue
        out[k] = v
    return out


def filter_payload_for_tier(data: dict[str, Any], tier: str) -> dict[str, Any]:
    """Keep CORE_DB_KEYS always; other keys must appear in the tier allowlist."""
    allowed = allowed_keys_for_tier(tier)
    normalized = normalize_incoming_keys(data)
    result: dict[str, Any] = {}

    for k, v in normalized.items():
        if k in CORE_DB_KEYS:
            result[k] = v
            continue
        if k in FORBIDDEN_KEYS:
            continue
        if k in allowed:
            result[k] = v

    return result


if __name__ == "__main__":
    assert tier_from_key_prefix("tk_basic_xx") == "T3"
    assert tier_from_key_prefix("tk_smart_x") == "T2"
    assert tier_from_key_prefix("tk_full_y") == "T1"
    t3 = filter_payload_for_tier(
        {"visitor_id": "v1", "likely_logged_in": True, "js_error_count": 2, "api_key": "k"},
        "T3",
    )
    assert t3.get("is_logged_in") is True
    assert "js_error" not in t3
    assert "api_key" not in t3
    t2 = filter_payload_for_tier({"js_error_count": 3, "visitor_id": "v"}, "T2")
    assert t2.get("js_error") == 3
    t2b = filter_payload_for_tier({"js_message": "x", "visitor_id": "v"}, "T2")
    assert "js_message" not in t2b
    t1 = filter_payload_for_tier({"payment_method": "card", "ca_user_foo": "bar"}, "T1")
    assert t1.get("payment_method") == "card"
    assert "ca_user_foo" not in t1
    print("event model checks ok")
