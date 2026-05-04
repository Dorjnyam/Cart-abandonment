---
sidebar_position: 3
title: Архитектур
---

# Системийн архитектур

Энэ хуудас Observer сервисийн бүтэц, өгөгдлийн урсгал, бүрэлдэхүүн хэсгүүдийн харилцааг тайлбарлана.

---

## Ерөнхий өгөгдлийн урсгал

```
Хэрэглэгчийн хөтөч
    │
    │  <script src="http://SERVER/static/snippet/track.js?key=tk_basic_xxx">
    │
    ▼
track.js (клиент дээр ажиллана)
    │  • API түлхүүрийн угтасаар tier тодорхойлно
    │  • Tier-д тохирох listener-ууд идэвхждэг
    │  • Scroll, click, device, visitor өгөгдөл цуглуулна
    │
    │  POST /track  { JSON payload }
    │  Header: X-API-Key: tk_basic_xxx
    │
    ▼
Observer Server (FastAPI + Uvicorn :8001)
    │
    ├─ APIKeyAuthMiddleware
    │     Tier тодорхойлно (T3/T2/T1)
    │     Зөвшөөрөлгүй бол 401 буцаана
    │
    ├─ _ingest() handler
    │     1. JSON задлах
    │     2. ip + user_agent нэмэх
    │     3. filter_payload_for_tier() — зөвшөөрөгдсөн талбар шүүх
    │     4. save_event() → PostgreSQL
    │     5. Fan-out (зэрэг):
    │         ├─ Kafka: raw_events topic
    │         ├─ Redis: ca:events:{visitor_id}
    │         │         ca:diagnosis:queue (session_end үед)
    │         └─ Session Service: HTTP POST (тохируулсан бол)
    │
    ▼
PostgreSQL — raw_events хүснэгт
    CORE баганууд + JSONB payload + tier
```

---

## Бүрэлдэхүүн хэсгүүд

### Observer Server

FastAPI дээр бүтсэн async HTTP сервер.

| Файл | Үүрэг |
|------|-------|
| `observer/main.py` | Route-ууд, middleware, lifespan |
| `observer/database.py` | PostgreSQL холболт, хүснэгт үүсгэлт, хадгалах/унших |
| `observer/redis_queue.py` | Redis LPUSH, холболт удирдлага |
| `observer/kafka_producer.py` | aiokafka producer, нийтлэлт |
| `observer/session_service_forwarder.py` | HTTP fan-out session service руу |
| `observer/models/event.py` | Payload шүүлт, tier allowlist |
| `observer/models/payload.py` | Pydantic validation model |
| `observer/models/field_catalog.py` | 54 талбарын metadata |
| `observer/snippet/track.js` | Клиент JS snippet |

### PostgreSQL — `raw_events` хүснэгт

```sql
CREATE TABLE raw_events (
    id          SERIAL PRIMARY KEY,
    visitor_id  TEXT,
    session_id  TEXT,
    event_type  TEXT,
    url         TEXT,
    referrer    TEXT,
    timestamp   TIMESTAMPTZ,
    ip          TEXT,
    user_agent  TEXT,
    payload     JSONB,     -- tier-д тохирсон нэмэлт талбарууд
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    tier        TEXT       -- T3 / T2 / T1
);
```

**Индексүүд:**
- `idx_raw_events_session` — `session_id` дээр
- `idx_raw_events_visitor` — `visitor_id` дээр
- `idx_raw_events_tier` — `tier` дээр

### Kafka

`raw_events` topic — event бүрийг бүрэн JSON-аар нийтэлнэ. Downstream consumer (diagnosis, ML pipeline) тусдаа процессоор уншина.

```
Observer → Kafka topic: raw_events
                ↓
    [Diagnosis consumer]  [ML pipeline]  [Analytics]
```

### Redis

Хоёр key ашиглана:

| Key | Утга | Зориулалт |
|-----|------|-----------|
| `ca:events:{visitor_id}` | LPUSH JSON | Real-time visitor feed |
| `ca:diagnosis:queue` | LPUSH JSON | `session_end` үед оношлогооны ажилтанд |

`REDIS_URL` тохируулаагүй бол Redis функц идэвхгүй — ingest хэвийн үргэлжилнэ.

---

## Tier систем

API түлхүүрийн **угтас** нь хадгалах өгөгдлийн гүнийг тодорхойлно:

```
tk_basic_*  →  T3  (суурь 24 payload талбар)
tk_smart_*  →  T2  (T3 + 20 нэмэлт = 44 талбар)
tk_full_*   →  T1  (T2 + 10 нэмэлт = 54 талбар)
```

Шүүлт нь серверийн тал дээр `filter_payload_for_tier()` функцэд хийгдэнэ — клиент илгээсэн ч серверт зөвшөөрөгдөөгүй талбар хадгалагдахгүй.

---

## Өгөгдлийн хадгалалтын бүтэц

### CORE баганууд (tier-ээс үл хамааран бүгд хадгалагдана)

`visitor_id`, `session_id`, `event_type`, `url`, `referrer`, `timestamp`, `ip`, `user_agent`, `tier`

### JSONB payload (tier-д тохирсон нэмэлт талбарууд)

```json
{
  "path": "/products",
  "device_type": "desktop",
  "click_count": 5,
  "cart_value": 89000,
  "payment_method": "QPay"
}
```

---

## Auth загвар

### Allowlist-гүй горим (default)

`tk_basic_`, `tk_smart_`, `tk_full_` угтас бүхий **аливаа** суффикс хүлээн авна.  
Туршилт болон хөгжүүлэлтэд тохиромжтой.

### Allowlist горим

`.env` файлд `OBSERVER_API_KEYS=tk_basic_abc,tk_full_xyz` тохируулбал зөвхөн бүртгэлтэй түлхүүрүүд ажиллана.

---

## Дараагийн алхам

- [Integration](/docs/integration) — track.js сайтдаа оруулах
- [API лавлах](/docs/reference/api) — endpoint бүрийн нарийвчилсан тайлбар
