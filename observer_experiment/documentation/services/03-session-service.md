---
sidebar_position: 3
title: Session Service
---

# Session Service

## 3.1 Тойм

| | |
|---|---|
| **Нэр** | Session Service |
| **Port** | 8002 |
| **Технологи** | Python 3.11, FastAPI + Uvicorn, Celery, asyncpg, aiokafka, redis-py async |
| **Үйлчилгээний төрөл** | Hybrid — REST API + Kafka event consumer + Celery background worker |

**Хийдэг зүйл:** Browser/хэрэглэгчийн raw event-үүдийг Redis-д хуримтлуулж, 30/60/90 секундийн цонхоор Kafka руу enriched session snapshot илгээж, эцсийн session бичлэгийг PostgreSQL-д хадгалдаг.

---

## 3.2 Архитектур

### Хамаарал

- **Kafka** — `raw_events` topic уншдаг; `session_enriched` topic руу бичдэг
- **Redis** — session state store, Celery broker, deduplication, TTL deadline tracking
- **PostgreSQL** (`sessions.sessions`) — эцсийн session хадгалалт

### Дата урсгал

```
Observer → Kafka: raw_events
  → Session Consumer (aiokafka)
  → Dedup check (Redis SET NX event_id-ээр)
  → accumulate_event() → Redis hash session:{id}
  → Celery: window tasks T+30s, T+60s, T+90s
  → emit_session_enriched() → Kafka: session_enriched
  → flush_session() → Kafka (final) + PostgreSQL
```

---

## 3.3 API Лавлагаа

| Арга | Зам | Тайлбар | Auth |
|------|-----|---------|------|
| GET | `/health` | Redis + Kafka liveness шалгалт | Үгүй |
| POST | `/ingest/raw-event` | HTTP-оор event хүлээн авах | X-API-Key _(заавал биш)_ |
| POST | `/ingest/flush-session` | Session-ийг хүчээр дуусгах | X-API-Key _(заавал биш)_ |
| GET | `/viewer` | Debug UI | Үгүй |
| GET | `/viewer/status` | Dependency health + telemetry | Үгүй |
| GET | `/viewer/events` | Сүүлийн 500 telemetry event | Үгүй |

---

## 3.4 Өгөгдлийн загвар

### Redis (session state)

- `session:{session_id}` _(hash)_ — `session_id`, `visitor_id`, `event_count`, `event_sequence`, `state`, гэх мэт бүх accumulated талбарууд
- `session_deadlines` _(sorted set)_ — TTL deadline (score = expiry epoch)
- `visitor:{visitor_id}:active` — visitor-ийн идэвхтэй session-ийг заадаг

### PostgreSQL: `sessions.sessions`

| Баганы нэр | Төрөл | Тайлбар |
|-----------|-------|---------|
| `session_id` | uuid PK | Session-ийн unique ID |
| `visitor_id` | uuid | Хэрэглэгчийн ID (indexed) |
| `tenant_id` | uuid | Tenant ID |
| `started_at` | timestamptz | Session эхэлсэн цаг (indexed) |
| `ended_at` | timestamptz | Session дууссан цаг |
| `state` | text | `NEW` / `ACTIVE` / `ABANDONED` / `CONVERTED` |
| `end_reason` | text | `timeout` / `unload` / `purchase` |
| `raw_session_payload` | jsonb | Бүрэн session hash dump |

---

## 3.5 Тохиргоо

| Хувьсагч | Үндсэн утга | Тайлбар |
|---------|------------|---------|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka broker хаяг |
| `RAW_EVENTS_TOPIC` | `raw_events` | Оролтын topic |
| `SESSION_ENRICHED_TOPIC` | `session_enriched` | Гаралтын topic |
| `REDIS_URL` | `redis://redis:6379/0` | Redis холболт |
| `PG_DSN` | `postgresql://...cartdb` | PostgreSQL холболт |
| `SESSION_TTL_SECONDS` | `1800` | Session idle timeout (30 мин) |
| `SESSION_WINDOWS` | `30,60,90` | Snapshot window-ийн интервал (секунд) |
| `BOT_THRESHOLD` | `0.7` | Bot_score дээш байвал event хаях |
| `SESSION_INGEST_API_KEY` | _(хоосон)_ | Тохируулбал `/ingest`-д X-API-Key шаардана |

---

## 3.6 Локалд ажиллуулах

```bash
cp session/.env.example session/.env
cd session && pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8002   # API
celery -A celery_app worker --loglevel=info          # Worker (тусдаа terminal)
```

- **Локал URL:** http://localhost:8002
- **Debug UI:** http://localhost:8002/viewer

:::info
Migration: Эхний ажиллуулалтад `_ensure_schema()`-оор автоматаар үүснэ.
:::

---

## 3.7 Алдааны шийдэл

| Алдааны шинж | Шалтгаан | Шийдэл |
|-------------|---------|--------|
| `timers_scheduled = 0` | Celery worker ажиллахгүй байна | Celery worker асаасан эсэхийг шалгана |
| `enriched_emitted = 0` | Kafka холболт алдаатай | `enriched_emit_failed` counter шалгана |
| `unregistered task` алдаа | Worker `celery_app.py` ачаалаагүй | Зөв `celery_app.py` ашиглаж байгааг шалгана |
| Давхардсан event | Dedup тохиргоогүй | `SESSION_DEDUPE_EVENT_ID=1` тохируулна |

---

## 3.8 Архитектурын шийдвэрүүд (ADRs)

- **Redis as session store:** Бага latency-тэй hash accumulation, built-in TTL
- **Celery for window snapshots:** Timed enriched emission-ийг hot ingest path-аас тусгаарладаг
- **Dual ingest (Kafka + HTTP):** Kafka-д шууд холбогдох боломжгүй Observer-ийг дэмждэг
- **UUIDv5 mapping:** Observer-ийн opaque ID-г deterministic UUID руу хөрвүүлдэг

---

## 3.9 Runbook

- **Аюулгүй дахин эхлүүлэх:** Redis state хадгалагдана; Uvicorn болон Celery worker тусдаа дахин эхлүүлнэ
- **DB migration:** `session/migrations/002_session_schema_fix.sql` — бүх statement идемпотент
- **Session мanuал flush:**
  ```bash
  POST /ingest/flush-session {"session_id": "<uuid>"}
  ```
