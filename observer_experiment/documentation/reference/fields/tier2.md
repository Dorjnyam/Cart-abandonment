---
sidebar_position: 3
title: Tier 2 нэмэлт
---

# Tier 2 — Аналитик payload талбарууд

`tk_smart_*` угтасаар Tier 3-ын 24 талбар **дээр** доорх 20 нэмэлт талбар хадгалагдана. Нийт: **44 payload талбар**.

**Судалгааны шийдвэр:** 23 боломжит T2 талбараас 20-ийг хадгалах.  
Хасагдсан 3 талбар: `button_text`, `filter_value`, `sort_value`.

---

## Нэмэлт T2 талбарууд

### Friction (бэрхшээлийн дохио)

| Талбар | Эх үүсвэр | Тайлбар |
|--------|-----------|---------|
| `rage_click` | client_derived | ~350ms дотор 3+ удаа ойролцоо цэгт дарсан тоо — хэрэглэгчийн бухимдлын дохио |
| `js_error` | client_derived | `window.onerror` / `unhandledrejection` — session дахь JS алдааны тоо |
| `outbound_click` | client_derived | Гадаад домайн руу шилжих `<a>` дарсан тоо |
| `action_detected` | click_metadata | Click event-ийн дотоод шошго (`"search"`, `"rage_click"` г.м.) |

### Page navigation (хуудасны навигаци)

| Талбар | Эх үүсвэр | Тайлбар |
|--------|-----------|---------|
| `back_navigation` | client_derived | `true` — хэрэглэгч browser "буцах" дарсан эсэх |
| `page_view_count` | client_derived | Session дахь нийт page view тоо |

### Commerce heuristic (URL-д суурилсан)

| Талбар | Эх үүсвэр | Тайлбар |
|--------|-----------|---------|
| `detected_page_type` | url_heuristic | `"home"`, `"product"`, `"category"`, `"cart"`, `"checkout"`, `"order_success"`, `"search"`, `"account"`, `"other"` — URL замаас дүгнэнэ |
| `product_slug` | url_heuristic | `/products/nike-air-force-1` → `"nike-air-force-1"` |
| `checkout_step_detected` | url_heuristic | `/checkout/step_2` → `"step_2"` |
| `search_query_from_url` | url_heuristic | `?q=nike` → `"nike"` (param: `q`, `query`, `search`, `keyword`) |
| `is_order_success` | url_heuristic | `true` — URL-д `/order-success`, `/thank-you` г.м. агуулагдах үед |
| `coupon_entered` | url_heuristic | URL-д coupon parameter байгаа эсэх |
| `filter_name` | url_heuristic | Шүүлтүүрийн нэр (query param-аас) |

### Commerce heuristic (DOM-оос хэмжсэн)

| Талбар | Эх үүсвэр | Тайлбар |
|--------|-----------|---------|
| `product_id` | client_measured | `[data-product-id]` буюу T1 `data-ca-id`-аас |
| `product_price` | client_measured | DOM selector эсвэл T1 `data-ca-price`-аас |
| `product_slug` | url_heuristic | URL-ийн сүүлийн segment |
| `product_category` | client_measured | `[data-category]` эсвэл breadcrumb-аас |
| `product_availability` | client_measured | `[data-available]` — нөөцтэй эсэх |
| `search_query` | client_measured | Хайлтын form submit-ийн `input` утга |
| `selected_quantity` | client_measured | Тоо ширхэг сонгуур |
| `selected_size` | client_measured | Хэмжээ сонгуур |

---

## Хасагдсан T2 талбарууд

| Талбар | Шалтгаан |
|--------|---------|
| `button_text` | Privacy эрсдэл — sensitive мэдээлэл товчны текстэд байж болно |
| `filter_value` | `filter_name` хангалттай; утга нь дэлгэрэнгүй байж болно |
| `sort_value` | Практик ач холбогдол хязгаарлагдмал |

---

## URL Heuristic тухай анхааруулга

`detected_page_type`, `product_slug` зэрэг талбарууд URL замаас **дүгнэлт** хийдэг тул таны дэлгүүрийн URL бүтэцтэй нийцэхгүй байж болно.

```
URL: /shop/item/nike-air-force-1
     ↓
detected_page_type = "other"   ← /products/ pattern таарахгүй!
product_slug       = null
```

**Шийдэл:** T1 `data-ca-*` attribute нэмэх эсвэл `window._ca_user`-д `detected_page_type` тохируулах.

---

## SQL жишээ

```sql
-- Хамгийн олон rage click гарсан хуудасууд
SELECT
  url,
  SUM((payload->>'rage_click')::int) AS total_rage,
  COUNT(*) AS sessions
FROM raw_events
WHERE tier IN ('T2','T1')
  AND payload->>'rage_click' IS NOT NULL
  AND (payload->>'rage_click')::int > 0
GROUP BY url
ORDER BY total_rage DESC
LIMIT 10;
```

```sql
-- Бараа хуудасны scroll depth
SELECT
  payload->>'product_slug' AS product,
  AVG((payload->>'max_scroll_pct')::int) AS avg_scroll,
  COUNT(*) AS views
FROM raw_events
WHERE tier IN ('T2','T1')
  AND payload->>'detected_page_type' = 'product'
  AND event_type = 'heartbeat'
GROUP BY product
ORDER BY views DESC;
```

---

## Дараагийн алхам

- [Tier 1 нэмэлт](./tier1.md) — `tk_full_*`-д нэмэгдэх 10 худалдааны талбар
- [Integration заавар](/docs/integration) — `data-ca-*` HTML тэмдэглэгдэхүүн нэмэх
