from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class SessionEvent(BaseModel):
    model_config = ConfigDict(extra="allow")

    event_type: str
    timestamp: datetime | None = None
    url: str | None = None
    path: str | None = None
    page: str | None = None
    referrer: str | None = None
    page_load_ms: float | None = None
    time_on_page_sec: float | None = None
    max_scroll_pct: float | None = None
    click_count: int | None = None
    mouse_move_count: int | None = None
    product_id: str | None = None
    product_price: float | None = None
    product_category: str | None = None
    action_detected: str | None = None


class AggregatedFields(BaseModel):
    # extra="ignore": session service emits internal fields (state, last_seen_at,
    # cart_add_count, etc.) that are not part of the feature contract — silently drop them.
    model_config = ConfigDict(extra="allow")

    visitor_id: str | None = None
    session_id: str | None = None
    visit_count: int = 0
    url: str | None = None
    path: str | None = None
    referrer: str | None = None
    page_load_ms: float = 0.0
    device_type: str | None = None
    language: str | None = None
    timezone: str | None = None
    time_on_page_sec: float = 0.0
    max_scroll_pct: float = 0.0
    scroll_up_count: int = 0
    click_count: int = 0
    active_time_ms: float = 0.0
    tab_hidden_count: int = 0
    tab_hidden_ms: float = 0.0
    copy_count: int = 0
    form_fields_count: int = 0
    form_fields_touched: int = 0
    bounce: bool = False
    session_duration_sec: float = 0.0
    is_logged_in: bool = False
    customer_type: str | None = None
    selected_quantity: int = 0
    rage_click: int = 0
    outbound_click: int = 0
    detected_page_type: str | None = None
    product_slug: str | None = None
    checkout_step_detected: int = 0
    search_query_from_url: str | None = None
    is_order_success: bool = False
    product_id: str | None = None
    product_price: float = 0.0
    product_category: str | None = None
    product_availability: str | None = None
    selected_size: str | None = None
    search_query: str | None = None
    filter_name: str | None = None
    js_error: int = 0
    page_view_count: int = 0
    back_navigation: int = 0
    coupon_entered: bool = False
    action_detected: str | None = None
    product_variant: str | None = None
    cart_value: float = 0.0
    cart_item_count: int = 0
    checkout_step: int = 0
    payment_method: str | None = None
    shipping_method: str | None = None
    order_total: float = 0.0
    discount_code: str | None = None
    is_sale: bool = False
    product_stock: int = 0
    cart_churn_count: int = 0
    cart_abandoned_count: int = 0  # visitor-level signal from session svc, used by trust barrier
    page_views: int = 0
    end_reason: str = ""
    abandoned: bool = False
    session_state: str = "NEW"
    has_purchase_success: bool = False
    has_checkout_start: bool = False
    has_cart_activity: bool = False
    final_event_type: str = ""
    product_name: str | None = None
    category: str | None = None
    price: float = 0.0
    quantity: int = 0
    cart_total: float = 0.0
    discount: float = 0.0
    shipping_cost: float = 0.0
    error_type: str | None = None
    order_id: str | None = None

    @model_validator(mode="before")
    @classmethod
    def convert_nulls_to_defaults(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data

        normalized = dict(data)
        for name, field in cls.model_fields.items():
            value = normalized.get(name)
            if value is None and field.default is not None:
                normalized[name] = field.default
                continue
            if isinstance(value, str):
                annotation = field.annotation
                try:
                    if annotation is int:
                        normalized[name] = int(float(value))
                    elif annotation is float:
                        normalized[name] = float(value)
                    elif annotation is bool and value.strip().lower() in {"true", "false"}:
                        normalized[name] = value.strip().lower() == "true"
                except ValueError:
                    normalized[name] = field.default
        return normalized


class SessionEnriched(BaseModel):
    # extra="ignore": session service emits top-level is_completed_purchase/state
    # fields that belong in aggregated_fields; drop them at this level.
    model_config = ConfigDict(extra="ignore")

    session_id: UUID
    visitor_id: UUID
    tenant_id: UUID
    started_at: datetime
    window_seconds: int | None = None
    session_state: str = "NEW"
    has_purchase_success: bool = False
    has_checkout_start: bool = False
    has_cart_activity: bool = False
    final_event_type: str = ""
    # Session service sends list[str] (event_type names only); SessionEvent objects
    # are used only for richer event payloads from windowed snapshots.
    event_sequence: list[str | dict] = Field(default_factory=list)
    aggregated_fields: AggregatedFields = Field(default_factory=AggregatedFields)


class FeatureSet(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    visitor_id: str = ""
    session_id: str = ""
    visit_count: int = 0
    url: str = ""
    path: str = ""
    referrer: str = ""
    page_load_ms: float = 0.0
    device_type: str = ""
    language: str = ""
    timezone: str = ""
    time_on_page_sec: float = 0.0
    max_scroll_pct: float = 0.0
    scroll_up_count: int = 0
    click_count: int = 0
    active_time_ms: float = 0.0
    tab_hidden_count: int = 0
    tab_hidden_ms: float = 0.0
    copy_count: int = 0
    form_fields_count: int = 0
    form_fields_touched: int = 0
    bounce: bool = False
    session_duration_sec: float = 0.0
    is_logged_in: bool = False
    customer_type: str = ""
    selected_quantity: int = 0
    rage_click: int = 0
    outbound_click: int = 0
    detected_page_type: str = ""
    product_slug: str = ""
    checkout_step_detected: int = 0
    search_query_from_url: str = ""
    is_order_success: bool = False
    product_id: str = ""
    product_price: float = 0.0
    product_category: str = ""
    product_availability: str = ""
    selected_size: str = ""
    search_query: str = ""
    filter_name: str = ""
    js_error: int = 0
    page_view_count: int = 0
    back_navigation: int = 0
    coupon_entered: bool = False
    action_detected: str = ""
    product_variant: str = ""
    cart_value: float = 0.0
    cart_item_count: int = 0
    checkout_step: int = 0
    payment_method: str = ""
    shipping_method: str = ""
    order_total: float = 0.0
    discount_code: str = ""
    is_sale: bool = False
    product_stock: int = 0
    cart_churn_count: int = 0
    page_views: int = 0
    end_reason: str = ""
    abandoned: bool = False
    event_count: int = 0
    is_mobile: bool = False
    # --- Computed features (own dedicated fields) ---
    frustration_index: float = 0.0
    commitment_depth: float = 0.0
    price_hesitation_score: float = 0.0
    hedonic_ratio: float = 0.0
    mongolian_trust_barrier: float = 0.0
    time_to_first_action_ms: float = 0.0
    avg_price_in_session: float = 0.0
    dist_product_count: int = 0
    hour_sin: float = 0.0
    hour_cos: float = 0.0
    dow_sin: float = 0.0
    dow_cos: float = 0.0
    # --- Mouse tracking (feeds Visibility Graph service) ---
    mouse_distance: float = 0.0
    mouse_speed: float = 0.0
    direction_changes: int = 0
    # --- ML target signal ---
    cart_abandonment_signal: bool = False


class FeatureVector(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    session_id: UUID
    tenant_id: UUID
    version: str
    variant: Literal["A", "B", "C", "D"] = "C"
    features: FeatureSet
    computed_at: datetime
    window_seconds: int | None = None
    session_state: str = "NEW"
    has_purchase_success: bool = False
    has_checkout_start: bool = False
    has_cart_activity: bool = False
    final_event_type: str = ""
    event_sequence: list[str | dict] = Field(default_factory=list)
