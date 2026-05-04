---
id: data-models
title: Observer — Өгөгдлийн загвар
sidebar_label: Data Models
---

# Өгөгдлийн загвар

## PostgreSQL: raw_events

```sql
CREATE TABLE raw_events (
    id          BIGSERIAL PRIMARY KEY,
    event_id    TEXT UNIQUE,
    visitor_id  TEXT,
    session_id  TEXT,
    event_type  TEXT,
    url         TEXT,
    referrer    TEXT,
    timestamp   TEXT,
    ip          TEXT,
    user_agent  TEXT,
    payload     JSONB NOT NULL DEFAULT '{}',
    tier        TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

## Index-үүд

| Index нэр | Багана | Зорилго |
|-----------|--------|---------|
| `idx_session` | `session_id` | Session-ийн бүх event |
| `idx_visitor` | `visitor_id` | Хэрэглэгчийн аналитик |
| `idx_event_type` | `event_type` | Төрлөөр шүүх |
| `idx_created` | `created_at DESC` | Сүүлийн event-үүд |
| `idx_payload_gin` | `payload GIN` | JSONB query |
| `idx_raw_events_tier` | `tier` | Tier-ээр шүүх |

## Tier-ийн талбарын жагсаалт

| Tier | Багтдаг талбарууд |
|------|-----------------|
| **T3** (23 талбар) | visit_count, device_type, click_count, max_scroll_pct, bounce... |
| **T2** (43 талбар) | T3 + rage_click, search_query, product_slug, js_error... |
| **T1** (54 талбар) | T2 + cart_value, cart_item_count, payment_method, order_total... |
