---
sidebar_position: 2
title: Tier 3 талбарууд
---

# Tier 3 — Суурь payload талбарууд

`tk_basic_*` угтасаар **зөвхөн доорх 24 талбар** JSONB payload-д хадгалагдана. Нэмэлт илгээлт серверт шүүгдэнэ.

**Судалгааны шийдвэр:** 29 боломжит талбараас 24-ийг хадгалах.  
Хасагдсан 5 талбар: `days_since_first`, `cart_abandoned_count`, `order_count` (feature service), `viewport_width`, `connection_type` (drop).

---

## Талбарын жагсаалт

| Талбар | Sector | Эх үүсвэр | Тайлбар |
|--------|--------|-----------|---------|
| `active_time_ms` | engagement | client_derived | Хуудаст идэвхтэй байсан нийт миллисекунд (таб нуугдсан, idle хугацааг хассан) |
| `bounce` | engagement | client_derived | `true` — зөвхөн нэг хуудас үзэж гарсан эсэх |
| `click_count` | engagement | client_derived | Session дахь нийт click тоо |
| `copy_count` | forms_copy | client_derived | Copy хийсэн тоо (Ctrl+C / сонгон copy) |
| `customer_type` | participant | client_measured | `"new"`, `"returning"`, `"vip"` — `window._ca_user` эсвэл хукаас |
| `device_type` | page_nav | client_derived | `"desktop"`, `"mobile"`, `"tablet"` |
| `form_fields_count` | forms_copy | client_derived | Хуудасны form талбарын тоо |
| `form_fields_touched` | forms_copy | client_derived | Хэрэглэгч гар тавьсан field-ийн нэрүүд (таслалаар тусгаарлагдсан) |
| `is_logged_in` | participant | client_derived | `window._ca_user.is_logged_in` эсвэл `likely_logged_in` — нэвтэрсэн эсэх |
| `language` | page_nav | client_measured | `navigator.language` — `"mn"`, `"en-US"` г.м. |
| `max_scroll_pct` | engagement | client_derived | Хуудсыг хамгийн доош хэр гүн гүйлгэсэн % |
| `page_load_ms` | page_nav | client_measured | `performance.timing` — хуудас бүрэн ачаалахад зарцуулсан ms |
| `path` | page_nav | client_measured | `window.location.pathname` — зам (`/products/nike-air-force-1`) |
| `referrer` | page_nav | client_measured | `document.referrer` — өмнөх хуудас |
| `scroll_up_count` | engagement | client_derived | Дээш гүйлгэсэн тоо (итгэл, эргэлзэлтийн дохио) |
| `session_duration_sec` | engagement | client_derived | `session_end` event-т: session-ийн нийт урт секундэд |
| `session_id` | participant | client_measured | UUID эсвэл opaque token — хуудас нэг нээлт |
| `tab_hidden_count` | engagement | client_derived | Таб нуугдсан удаагийн тоо |
| `tab_hidden_ms` | engagement | client_derived | Таб нуугдаж байсан нийт миллисекунд |
| `time_on_page_sec` | engagement | client_derived | Хуудсан дээр байсан нийт секунд (tab hidden хамрагдсан) |
| `timezone` | page_nav | client_measured | `Intl.DateTimeFormat` — `"Asia/Ulaanbaatar"` |
| `url` | page_nav | client_measured | `window.location.href` — бүтэн URL (CORE баганад давхар байна) |
| `visit_count` | participant | client_derived | localStorage-д хадгалагдах — хэрэглэгч хэдэн удаа зочилсон |
| `visitor_id` | participant | client_measured | localStorage-д хадгалагдах — хөтчийн нэгдмэл ID |

---

## Хасагдсан T3 талбарууд

| Талбар | Шалтгаан |
|--------|---------|
| `days_since_first` | Feature service тооцоолно (Observer real-time-д хэрэггүй) |
| `cart_abandoned_count` | Feature service тооцоолно |
| `order_count` | Feature service тооцоолно |
| `viewport_width` | Практик ач холбогдол бага, device_type хангалттай |
| `connection_type` | Navigator API browser дэмжлэг тэгш биш |

---

## SQL жишээ

```sql
-- T3 event-ийн scroll дүн
SELECT
  session_id,
  MAX((payload->>'max_scroll_pct')::int) AS deepest_scroll,
  SUM((payload->>'click_count')::int)    AS total_clicks,
  MAX((payload->>'time_on_page_sec')::int) AS time_on_page
FROM raw_events
WHERE tier = 'T3'
  AND event_type = 'heartbeat'
GROUP BY session_id
ORDER BY deepest_scroll DESC;
```

---

## Дараагийн алхам

- [Tier 2 нэмэлт](./tier2.md) — `tk_smart_*`-д нэмэгдэх 20 талбар
- [Integration заавар](/docs/integration) — сайтдаа T3 key оруулах
