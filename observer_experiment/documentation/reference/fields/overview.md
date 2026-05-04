---
sidebar_position: 1
title: Талбарын тойм
---

# Талбарын тойм

Observer-ийн `raw_events` хүснэгтэд хадгалагдах өгөгдлийн бүтэц, tier систем, CORE/JSONB ялгааг тайлбарлана.

---

## Tier систем

API түлхүүрийн **угтас** нь хадгалах payload талбарын тоо, гүнийг тодорхойлно:

| Угтас | Tier | Payload талбар | Хэзээ ашиглах |
|-------|------|---------------|---------------|
| `tk_basic_*` | **T3** | 24 талбар | Энгийн хуудасны аналитик |
| `tk_smart_*` | **T2** | 44 талбар (T3 + 20) | Бараа, хайлт, friction шинжилгээ |
| `tk_full_*` | **T1** | 54 талбар (T2 + 10) | Checkout, сагс, QPay/SocialPay хянах |

**Шүүлт нь серверт хийгдэнэ.** Клиент T2 талбарыг `tk_basic_` түлхүүрээр илгээсэн ч серверт шүүгдэж хадгалагдахгүй.

---

## CORE баганууд vs JSONB payload

### CORE баганууд — tier-ээс үл хамааран бүгд хадгалагдана

| Багана | Тайлбар |
|--------|---------|
| `id` | Автомат дугаар (PRIMARY KEY) |
| `visitor_id` | Хөтчийн localStorage-д хадгалагдах ID |
| `session_id` | Нэг хуудас нээлтийн ID |
| `event_type` | Үйл явдлын төрөл (`page_view`, `heartbeat`, г.м.) |
| `url` | Хуудасны бүтэн URL |
| `referrer` | Өмнөх хуудас |
| `timestamp` | Клиентийн цаг (ISO 8601) |
| `ip` | Серверт ирсэн IP хаяг |
| `user_agent` | Хөтчийн User-Agent string |
| `payload` | JSONB — tier-д тохирсон нэмэлт талбарууд |
| `created_at` | Серверт хадгалагдсан цаг (UTC) |
| `tier` | `T3` / `T2` / `T1` |

### JSONB payload

Tier-д зөвшөөрөгдсөн нэмэлт талбарууд энд хадгалагдана.

```sql
-- Payload-аас талбар унших
SELECT payload->>'detected_page_type' AS page_type
FROM raw_events
WHERE tier IN ('T2','T1');

-- Тоон утга
SELECT (payload->>'cart_value')::numeric AS cart_value
FROM raw_events
WHERE event_type = 'cart_add';
```

:::caution Давхардлын тухай
`url` нь CORE баганад болон `payload->>'url'`-д давхар байж болно. Viewer эсвэл SQL-д **CORE баганыг** (`raw_events.url`) эх үүсвэр болгон авна.
:::

---

## Талбарын ангилал (sector_id)

Судалгааны зорилгоор талбаруудыг 7 бүлэгт хуваана:

| `sector_id` | Агуулга | Жишээ талбарууд |
|-------------|---------|-----------------|
| `participant` | Хэрэглэгчийн профайл | `visitor_id`, `is_logged_in`, `customer_type` |
| `page_nav` | Навигаци, хуудасны мэдээлэл | `url`, `path`, `device_type`, `page_load_ms` |
| `engagement` | Хэрэглэлтийн зан төлөв | `click_count`, `scroll_up_count`, `active_time_ms` |
| `forms_copy` | Form болон clipboard | `form_fields_count`, `copy_count` |
| `friction` | Бэрхшээлийн дохио | `rage_click`, `js_error`, `outbound_click` |
| `commerce_heuristic` | URL-д суурилсан хэмжилт | `product_slug`, `detected_page_type`, `is_order_success` |
| `commerce_explicit` | Тодорхой худалдааны өгөгдөл | `cart_item_count`, `payment_method`, `order_total` |

---

## Талбарын эх үүсвэр

| `source` утга | Тайлбар |
|--------------|---------|
| `client_measured` | Snippet шууд хэмжинэ (`window.navigator`, `document` г.м.) |
| `client_derived` | Snippet тооцоолж гаргана (click тоо, session урт) |
| `url_heuristic` | URL зам / query параметраас дүгнэнэ |
| `click_metadata` | Click event-ийн element metadata |
| `t1_explicit` | T1 `data-ca-*` attribute буюу `_ca_user`-аас |

---

## Дипломын судалгааны шийдвэр

`field_research_map_mn.pdf`-ийн дагуу 62 payload талбараас **54 талбар** хадгалагдана:

| Tier | Нийт | Хадгалах | Хасах/шилжүүлэх |
|------|------|----------|-----------------|
| T3 | 29 | 24 | 5 |
| T2 | 23 | 20 | 3 |
| T1 | 10 | 10 | 0 |
| **Нийт** | **62** | **54** | **8** |

Хасагдсан/шилжүүлсэн талбарууд:
- **Feature service руу:** `days_since_first`, `cart_abandoned_count`, `order_count`
- **Observer-оос хасагдсан:** `viewport_width`, `connection_type`
- **Drop (T2):** `button_text`, `filter_value`, `sort_value`

---

## "Missing" талбар гэж юу вэ?

Viewer-ийн Tier Inspect tab дахь ногоон/саарал дугуй тэмдэг нь **тухайн нэг event-ийн payload-д** тухайн талбар байгаа эсэхийг харуулна.

- **Хоосон нь хэвийн:** Зарим талбар зөвхөн тодорхой `event_type`-д буюу T1 markup шаардлагатай тохиолдолд л гарна.
- **Tier буруу:** `tk_basic_` түлхүүрт T2 талбарыг хүсвэл `tk_smart_` эсвэл `tk_full_` ашиглана.

---

## Live JSON лавлах

Сервис ажиллаж байх үед:

```bash
curl http://localhost:8001/api/field-catalog
```

Хариу нь `sectors`, `fields`, `core_columns`, `tier_sets` агуулна.

---

## Дэлгэрэнгүй

- [Tier 3 талбарууд](./tier3.md) — `tk_basic_*` зөвшөөрөх 24 талбар
- [Tier 2 нэмэлт](./tier2.md) — `tk_smart_*`-д нэмэгдэх 20 талбар
- [Tier 1 нэмэлт](./tier1.md) — `tk_full_*`-д нэмэгдэх 10 талбар
- [Судалгааны map + pipeline field](/project-docs/research_field_map)
