# Судалгааны талбарын зураглал — Одоогоор ашиглаж буй 54 талбар

Энэ хуудас нь `field_research_map_mn.pdf` дээрх шийдвэрээр **одоогийн судалгаанд ашиглах 54 талбар**-ыг Tier тус бүрээр жагсаав.

| Tier | Нийт | Ашиглах |
|------|------|---------|
| Tier 3 | 29 | 24 |
| Tier 2 | 23 | 20 |
| Tier 1 | 10 | 10 |
| Нийт | 62 | **54** |

## Tier 3 — 24 талбар

**Тайлбар:** суурь зан үйлийн болон сессийн үндсэн дохио. Funnel, engagement, Монгол контекстийн үндсэн шүүлтүүрүүд.

| Талбар |
|--------|
| `visitor_id` |
| `session_id` |
| `visit_count` |
| `url` |
| `path` |
| `referrer` |
| `page_load_ms` |
| `device_type` |
| `language` |
| `timezone` |
| `time_on_page_sec` |
| `max_scroll_pct` |
| `click_count` |
| `active_time_ms` |
| `tab_hidden_count` |
| `tab_hidden_ms` |
| `copy_count` |
| `form_fields_count` |
| `form_fields_touched` |
| `bounce` |
| `session_duration_sec` |
| `is_logged_in` |
| `customer_type` |
| `selected_quantity` |

## Tier 2 — 20 талбар

**Тайлбар:** friction, heuristic, product intent болон checkout intent-г сайжруулах ухаалаг дохио.

| Талбар |
|--------|
| `rage_click` |
| `outbound_click` |
| `detected_page_type` |
| `product_slug` |
| `checkout_step_detected` |
| `search_query_from_url` |
| `is_order_success` |
| `product_id` |
| `product_price` |
| `product_category` |
| `product_availability` |
| `selected_size` |
| `search_query` |
| `filter_name` |
| `js_error` |
| `page_view_count` |
| `back_navigation` |
| `coupon_entered` |
| `action_detected` |
| `product_variant` |

## Tier 1 — 10 талбар

**Тайлбар:** хамгийн өндөр intent болон checkout diagnostics. Монгол контекстэд `payment_method` онцгой ач холбогдолтой.

| Талбар |
|--------|
| `cart_value` |
| `cart_item_count` |
| `checkout_step` |
| `payment_method` |
| `shipping_method` |
| `order_total` |
| `discount_code` |
| `is_sale` |
| `product_variant` |
| `product_stock` |

## Ашиглахгүй / шилжүүлэх талбарууд

### Tier 3-аас
- Шилжүүлэх: `days_since_first`, `cart_abandoned_count`, `order_count`
- Хасах: `viewport_width`, `connection_type`

### Tier 2-оос
- Хасах: `button_text`, `filter_value`, `sort_value`

## Тэмдэглэл

- Энэ хуудас нь **54 талбарын профайл**-ыг л харуулна.
- Code allowlist (`event.py`) одоо 62 хэвээр бол тусдаа implementation шаардлагатай.
