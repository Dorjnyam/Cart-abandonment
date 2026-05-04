---
id: api
title: Observer — API Лавлагаа
sidebar_label: API
---

# API Лавлагаа

## Endpoint-үүдийн жагсаалт

| Арга | Зам | Тайлбар | Auth |
|------|-----|---------|------|
| POST | `/track` | Event бүртгэх (үндсэн) | X-API-Key |
| POST | `/events` | `/track`-ийн alias | X-API-Key |
| POST | `/collect` | `/track`-ийн alias | X-API-Key |
| GET | `/health` | Бэлэн байдлын шалгалт | Үгүй |
| GET | `/viewer` | HTML dashboard UI | Үгүй |
| GET | `/api/keys/validate` | Key формат шалгах | Үгүй |
| POST | `/api/keys/generate` | Шинэ key үүсгэх | Үгүй |
| GET | `/api/field-catalog` | Field metadata | Үгүй |
| GET | `/session/{id}` | Session дэлгэрэнгүй | X-Admin-Key |
| GET | `/admin/events` | Event жагсаалт | X-Admin-Key |
| POST | `/admin/clear` | Бүх event устгах | X-Admin-Key |

## POST /track

### Request

```json
{
  "visitor_id": "v_abc123",
  "session_id": "sess_xyz789",
  "event_type": "page_view",
  "url": "https://example.com/products/widget",
  "device_type": "desktop",
  "cart_value": 129.99
}
```

**Headers:**
- `X-API-Key: tk_basic_xxxxx` (эсвэл `Authorization: Bearer tk_basic_xxxxx`)

### Response (200 OK)

```json
{
  "status": "ok",
  "id": 1234,
  "tier": "T3",
  "received_fields": ["visitor_id", "session_id", "event_type", "url"],
  "payload_field_count": 2
}
```

## Алдааны кодууд

| Код | Утга |
|-----|------|
| 401 | API key алдаатай эсвэл байхгүй |
| 403 | Admin key буруу |
| 422 | Payload формат буруу |
| 503 | PostgreSQL унасан эсвэл admin key тохиргоогүй |
