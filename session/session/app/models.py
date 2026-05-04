from __future__ import annotations

from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SessionState(StrEnum):
    NEW = "NEW"
    ACTIVE = "ACTIVE"
    ABANDONED = "ABANDONED"
    CONVERTED = "CONVERTED"


class RawEventPayload(BaseModel):
    model_config = ConfigDict(extra="allow")

    # Page location
    page: str | None = None
    page_name: str | None = None
    page_path: str | None = None
    page_url: str | None = None
    url: str | None = None
    path: str | None = None
    referrer: str | None = None
    # T3 fields (track.js canonical names)
    device_type: str | None = None
    language: str | None = None
    timezone: str | None = None
    visit_count: int | None = None
    page_load_ms: float | None = None
    time_on_page_sec: float | None = None
    max_scroll_pct: float | None = None
    scroll_up_count: int | None = None
    active_time_ms: float | None = None
    tab_hidden_count: int | None = None
    tab_hidden_ms: float | None = None
    copy_count: int | None = None
    form_fields_count: int | None = None
    bounce: bool | None = None
    is_logged_in: bool | None = None
    customer_type: str | None = None
    # T2 fields
    click_count: int | None = None
    form_fields_touched: int | None = None
    rage_click: int | None = None
    back_navigation: int | None = None
    outbound_click: int | None = None
    js_error: int | None = None
    page_view_count: int | None = None
    selected_quantity: int | None = None
    selected_size: str | None = None
    action_detected: str | None = None
    detected_page_type: str | None = None
    product_slug: str | None = None
    checkout_step_detected: int | None = None
    search_query_from_url: str | None = None
    is_order_success: bool | None = None
    product_id: str | None = None
    product_price: float | None = None
    product_category: str | None = None
    product_availability: str | None = None
    search_query: str | None = None
    filter_name: str | None = None
    coupon_entered: bool | None = None
    # T1 fields
    cart_value: float | None = None
    cart_item_count: int | None = None
    checkout_step: int | None = None
    cart_churn_count: int | None = None
    payment_method: str | None = None
    shipping_method: str | None = None
    order_total: float | None = None
    discount_code: str | None = None
    is_sale: bool | None = None
    product_variant: str | None = None
    product_stock: int | None = None


class AggregatedFields(BaseModel):
    model_config = ConfigDict(extra="allow")

    event_count: int = 0
    state: SessionState | None = None
    last_seen_at: datetime | None = None
    is_completed_purchase: bool | None = None
    cart_add_count: int | None = None
    cart_remove_count: int | None = None
    checkout_attempts: int | None = None
    time_on_page_total_ms: float | None = None
    last_page: str | None = None
    last_page_seen_at: datetime | None = None
    device_type: str | None = None
    checkout_step: int | None = None
    form_fields_touched: int | None = None
    rage_click: int | None = None
    back_navigation: int | None = None
    cart_churn_count: int | None = None
    cart_value: float | None = None
    cart_item_count: int | None = None
    time_on_page_sec: float | None = None
    max_scroll_pct: float | None = None
    click_count: int | None = None


class RawEvent(BaseModel):
    session_id: UUID
    visitor_id: UUID
    tenant_id: UUID
    event_type: str
    payload: RawEventPayload
    timestamp: datetime
    bot_score: float = 0.0
    event_id: str | None = None
    # Top-level CORE_DB_KEYS forwarded from observer (stripped from payload by observer_adapter)
    url: str | None = None
    referrer: str | None = None


class SessionEnriched(BaseModel):
    session_id: UUID
    visitor_id: UUID
    tenant_id: UUID
    started_at: datetime
    window_seconds: int | None
    event_sequence: list[str]
    aggregated_fields: AggregatedFields
