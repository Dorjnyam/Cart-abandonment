"""
Pydantic v2 EventPayload — typed envelope for inbound events.

Validation order:
  1. model_validator(mode='before') strips forbidden keys and normalises aliases
     via the existing filter_payload_for_tier() / normalize_incoming_keys() logic.
  2. Field-level validators enforce types on the structured fields (session_id
     UUID format, timestamp coercion, tier literal).
  3. All 54 payload keys declared Optional[Any] = None so unknown-tier combos
     don't reject valid T3 payloads that simply lack T1 fields.

The dict-based filtering in event.py remains authoritative for the allowlist;
this model adds typed validation on top without duplicating the allowlist logic.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Literal, Optional

from pydantic import BaseModel, field_validator, model_validator

from observer.models.event import (
    CORE_DB_KEYS,
    filter_payload_for_tier,
    normalize_incoming_keys,
)

# UUID v4 loose pattern (hyphenated or bare 32 hex chars)
_UUID_RE = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)


class EventPayload(BaseModel):
    """Validated representation of one inbound event."""

    model_config = {"extra": "ignore", "populate_by_name": True}

    # ── Core DB columns (always expected) ──────────────────────────────────
    event_id: Optional[str] = None   # client dedup key; None → NULL in DB (multiple NULLs allowed)
    visitor_id: Optional[str] = None
    session_id: Optional[str] = None
    event_type: Optional[str] = None
    url: Optional[str] = None
    referrer: Optional[str] = None
    timestamp: Optional[datetime] = None
    ip: Optional[str] = None
    user_agent: Optional[str] = None

    # ── Tier tag (injected by ingest handler after key resolution) ──────────
    tier: Optional[Literal["T1", "T2", "T3"]] = None

    # ── T3 payload fields ───────────────────────────────────────────────────
    visit_count: Optional[Any] = None
    path: Optional[Any] = None
    page_load_ms: Optional[Any] = None
    device_type: Optional[Any] = None
    language: Optional[Any] = None
    timezone: Optional[Any] = None
    time_on_page_sec: Optional[Any] = None
    max_scroll_pct: Optional[Any] = None
    scroll_up_count: Optional[Any] = None
    click_count: Optional[Any] = None
    active_time_ms: Optional[Any] = None
    tab_hidden_count: Optional[Any] = None
    tab_hidden_ms: Optional[Any] = None
    copy_count: Optional[Any] = None
    form_fields_count: Optional[Any] = None
    form_fields_touched: Optional[Any] = None
    bounce: Optional[Any] = None
    session_duration_sec: Optional[Any] = None
    is_logged_in: Optional[Any] = None
    customer_type: Optional[Any] = None

    # ── T2 extra fields ─────────────────────────────────────────────────────
    action_detected: Optional[Any] = None
    rage_click: Optional[Any] = None
    outbound_click: Optional[Any] = None
    detected_page_type: Optional[Any] = None
    product_slug: Optional[Any] = None
    checkout_step_detected: Optional[Any] = None
    search_query_from_url: Optional[Any] = None
    is_order_success: Optional[Any] = None
    product_id: Optional[Any] = None
    product_price: Optional[Any] = None
    product_category: Optional[Any] = None
    product_availability: Optional[Any] = None
    selected_size: Optional[Any] = None
    selected_quantity: Optional[Any] = None
    search_query: Optional[Any] = None
    filter_name: Optional[Any] = None
    coupon_entered: Optional[Any] = None
    js_error: Optional[Any] = None
    page_view_count: Optional[Any] = None
    back_navigation: Optional[Any] = None

    # ── T1 extra fields ─────────────────────────────────────────────────────
    cart_value: Optional[Any] = None
    cart_item_count: Optional[Any] = None
    checkout_step: Optional[Any] = None
    payment_method: Optional[Any] = None
    shipping_method: Optional[Any] = None
    order_total: Optional[Any] = None
    discount_code: Optional[Any] = None
    is_sale: Optional[Any] = None
    product_variant: Optional[Any] = None
    product_stock: Optional[Any] = None

    # ── Pre-validation: normalise aliases + apply tier allowlist ───────────
    @model_validator(mode="before")
    @classmethod
    def normalise_and_filter(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values
        tier = values.get("tier")
        if tier and isinstance(tier, str):
            # filter_payload_for_tier keeps CORE_DB_KEYS + tier-allowed payload keys
            filtered = filter_payload_for_tier(values, tier)
            # Re-attach tier and server-injected fields that filter strips
            filtered["tier"] = tier
            for k in ("ip", "user_agent"):
                if k in values:
                    filtered[k] = values[k]
            return filtered
        # No tier yet (will be set after key resolution) — just normalise aliases
        return normalize_incoming_keys(values)

    # ── session_id: accept UUID or short opaque tokens ─────────────────────
    @field_validator("session_id", mode="before")
    @classmethod
    def validate_session_id(cls, v: Any) -> Any:
        if v is None:
            return v
        s = str(v).strip()
        if not s:
            return None
        # Accept bare UUIDs, hyphenated UUIDs, or short opaque strings (≥8 chars)
        if _UUID_RE.match(s) or len(s) >= 8:
            return s
        raise ValueError(f"session_id looks invalid: {s!r}")

    # ── timestamp: accept ISO strings, epoch ints/floats, or datetime ──────
    @field_validator("timestamp", mode="before")
    @classmethod
    def coerce_timestamp(cls, v: Any) -> Any:
        if v is None or isinstance(v, datetime):
            return v
        if isinstance(v, (int, float)):
            # Treat large ints as milliseconds (JS Date.now()), small as seconds
            ts = v / 1000 if v > 1e10 else v
            return datetime.fromtimestamp(ts, tz=timezone.utc)
        if isinstance(v, str):
            s = v.strip()
            if not s:
                return None
            # Try ISO first, then fallback to epoch string
            try:
                return datetime.fromisoformat(s.replace("Z", "+00:00"))
            except ValueError:
                try:
                    f = float(s)
                    ts = f / 1000 if f > 1e10 else f
                    return datetime.fromtimestamp(ts, tz=timezone.utc)
                except ValueError:
                    raise ValueError(f"Cannot parse timestamp: {v!r}")
        raise ValueError(f"Unsupported timestamp type: {type(v)}")

    def to_ingest_dict(self) -> dict[str, Any]:
        """
        Dump back to a plain dict for save_event() and Kafka publish.
        Excludes None values; converts datetime → ISO string for JSON safety.
        """
        out: dict[str, Any] = {}
        for field, value in self.model_dump(exclude_none=True).items():
            if isinstance(value, datetime):
                out[field] = value.isoformat()
            else:
                out[field] = value
        return out
