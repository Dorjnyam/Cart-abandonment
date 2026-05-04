---
id: data-models
title: Session — Өгөгдлийн загвар
sidebar_label: Data Models
---

# Өгөгдлийн загвар

## Redis (session state)

| Key | Төрөл | Агуулга |
|-----|-------|---------|
| `session:{id}` | Hash | session_id, visitor_id, event_count, state, event_sequence гэх мэт |
| `session_deadlines` | Sorted Set | TTL deadline (score = expiry epoch) |
| `session_winsched:{id}:{window}` | String | Celery window task idempotency guard |
| `visitor:{id}:active` | String | Visitor → active session mapping |

## PostgreSQL: sessions.sessions

| Баганы нэр | Төрөл | Тайлбар |
|-----------|-------|---------|
| `session_id` | uuid PK | Unique session ID |
| `visitor_id` | uuid | Хэрэглэгчийн ID (indexed) |
| `tenant_id` | uuid | Tenant ID |
| `started_at` | timestamptz | Session эхэлсэн цаг |
| `ended_at` | timestamptz | Session дууссан цаг |
| `state` | text | NEW / ACTIVE / ABANDONED / CONVERTED |
| `end_reason` | text | timeout / unload / purchase |
| `raw_session_payload` | jsonb | Бүрэн session hash dump |

## Kafka: session_enriched message

```json
{
  "session_id": "uuid",
  "visitor_id": "uuid",
  "tenant_id": "uuid",
  "started_at": "ISO8601",
  "window_seconds": 60,
  "event_sequence": ["page_view", "click", "scroll"],
  "aggregated_fields": { "event_count": 12, "cart_add_count": 2 }
}
```
