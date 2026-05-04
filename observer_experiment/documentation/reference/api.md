---
sidebar_position: 1
title: API лавлах
---

# API лавлах

Observer сервисийн бүх HTTP endpoint-ийн тайлбар. Сервис `http://localhost:8001` дээр ажиллана.

---

## Нотлох (Authentication)

API түлхүүрийг гурван аргаар дамжуулж болно:

```bash
# 1. Header (track.js-д ашиглагдана)
curl -H "X-API-Key: tk_basic_xxx" ...

# 2. Bearer token
curl -H "Authorization: Bearer tk_basic_xxx" ...

# 3. JSON body (production-д log-оос хамгаалах зорилгоор)
curl -d '{"api_key":"tk_basic_xxx", ...}' ...
```

**Алдаа:** Түлхүүр байхгүй эсвэл буруу угтастай бол `401 Unauthorized`.

---

## Event Ingest

### `POST /track`

Үндсэн event хүлээн авах endpoint. `track.js` энд илгээнэ.

**Request body:**

```json
{
  "api_key": "tk_basic_xxx",
  "event_type": "page_view",
  "session_id": "sess_abc123",
  "visitor_id": "vis_xyz789",
  "url": "https://example.mn/products",
  "referrer": "https://google.com",
  "timestamp": "2026-04-17T10:00:00Z"
}
```

| Талбар | Шаардлага | Тайлбар |
|--------|-----------|---------|
| `api_key` | Заавал* | T3/T2/T1 угтастай түлхүүр |
| `event_type` | Заавал | `page_view`, `heartbeat`, г.м. |
| `session_id` | Зөвлөмж | UUID эсвэл opaque token |
| `visitor_id` | Зөвлөмж | Persistent visitor ID |
| `url` | Зөвлөмж | Одоогийн хуудасны URL |
| `timestamp` | Заавал биш | ISO 8601 (default: серверийн цаг) |

*Header-ээр дамжуулсан бол body-д хэрэггүй.

**Амжилттай хариу (`200 OK`):**

```json
{
  "status": "ok",
  "id": 1342,
  "tier": "T3",
  "received_fields": ["event_type", "session_id", "visitor_id", "url", "ip", "user_agent"],
  "payload_field_count": 0
}
```

### `POST /collect`

`/track`-тай **яг ижил** handler. Зарим adblock extension `/track` замыг хааж болох тул нөөц нэр болгон оруулсан.

---

## Өгөгдөл унших

### `GET /events`

PostgreSQL-ийн event-үүдийг буцаана.

**Query параметрүүд:**

| Параметр | Төрөл | Тайлбар |
|---------|-------|---------|
| `limit` | int | Хэдэн event (default: 50, max: 1000) |
| `event_type` | string | Шүүлт: `page_view`, `heartbeat`, г.м. |
| `session_id` | string | Тухайн session-ийн event-үүд |
| `visitor_id` | string | Тухайн visitor-ийн event-үүд |
| `tier` | string | `T1`, `T2`, `T3` |

```bash
curl "http://localhost:8001/events?limit=10&event_type=page_view"
```

### `GET /stats`

Нийт тоо, event_type-ийн хуваарилалт, шилдэг URL-ууд.

```bash
curl http://localhost:8001/stats
```

```json
{
  "total_events": 1324,
  "unique_sessions": 17,
  "unique_visitors": 8,
  "event_types": {
    "heartbeat": 902,
    "page_view": 41,
    "cart_add": 5
  },
  "top_urls": [
    {"url": "http://localhost:3000/", "count": 271}
  ]
}
```

### `GET /fields`

JSONB payload дахь түлхүүрүүдийн давтамжийн шинжилгээ.

### `GET /session/{session_id}`

Тухайн session-ийн хураангуй + бүх event.

```bash
curl http://localhost:8001/session/sess_001
```

### `GET /visitor/{visitor_id}`

Тухайн visitor-ийн бүх session-ийн жагсаалт.

### `GET /viewer`

PostgreSQL Viewer — браузерт нээгдэх HTML dashboard. Дэлгэрэнгүй шинжилгээнд ашиглана.

---

## API Түлхүүр удирдлага

### `POST /api/keys/generate`

Шинэ API түлхүүр үүсгэнэ.

```bash
curl -X POST http://localhost:8001/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"tier": "T2"}'
```

| `tier` утга | Үүсэх угтас | Өгөгдлийн гүн |
|-------------|-------------|--------------|
| `"T3"` | `tk_basic_` | 24 payload талбар |
| `"T2"` | `tk_smart_` | 44 payload талбар |
| `"T1"` | `tk_full_` | 54 payload талбар |

### `GET /api/keys/validate`

Түлхүүр хүчинтэй эсэх, tier-ийг шалгана.

```bash
curl "http://localhost:8001/api/keys/validate?key=tk_basic_test"

# Эсвэл POST-оор
curl -X POST http://localhost:8001/api/keys/validate \
  -H "Content-Type: application/json" \
  -d '{"key": "tk_basic_test"}'
```

### `GET /api/keys/status`

Allowlist горим асаалттай эсэхийг шалгана.

---

## Field Catalog

### `GET /api/field-catalog`

54 payload талбарын metadata-г буцаана. Tier, sector, эх үүсвэр, Монгол тайлбарыг агуулна.

```bash
curl http://localhost:8001/api/field-catalog
```

Хариуны бүтэц:

```json
{
  "version": "2.0",
  "sectors": {...},
  "core_columns": [...],
  "fields": [
    {
      "name": "click_count",
      "tier_min": "T3",
      "sector_id": "engagement",
      "source": "client_derived",
      "label_mn": "Даралтын тоо",
      "notes_mn": "Session дахь нийт click тоо"
    }
  ],
  "tier_sets": {
    "T3": [...],
    "T2": [...],
    "T1": [...]
  }
}
```

---

## Health

### `GET /health`

Сервисийн төлөв, Kafka холболтыг шалгана.

```bash
curl http://localhost:8001/health
```

```json
{
  "status": "ok",
  "service": "observer",
  "kafka": {
    "producer_ready": true,
    "topic": "raw_events",
    "bootstrap_env_set": true
  }
}
```

---

## Статик файл

### `GET /static/snippet/track.js`

Клиент JS snippet. `?key=` параметр заавал шаардлагатай.

```html
<script src="http://localhost:8001/static/snippet/track.js?key=tk_basic_xxx"></script>
```

### `GET /snippet-test`

Snippet-ийн ажиллагааг шалгах тест хуудас.

---

## SQL query (туршилт)

### `POST /query`

Зөвхөн `SELECT` query-г ажиллуулна. Production-д идэвхгүй болгохыг зөвлөнө.

```bash
curl -X POST http://localhost:8001/query \
  -H "Content-Type: application/json" \
  -d '{"sql": "SELECT event_type, COUNT(*) FROM raw_events GROUP BY event_type"}'
```

---

## HTTP статус кодууд

| Код | Тайлбар |
|-----|---------|
| `200` | Амжилттай |
| `401` | API түлхүүр байхгүй эсвэл буруу |
| `422` | Request body validation алдаа |
| `500` | Серверийн дотоод алдаа |
