---
sidebar_position: 2
title: Observer Service
---

# Observer Service

## 2.1 Тойм

| | |
|---|---|
| **Нэр** | Observer Service |
| **Port** | 8001 |
| **Технологи** | Python 3.11+, FastAPI, Uvicorn, asyncpg, aiokafka, redis.asyncio, Pydantic |
| **Үйлчилгээний төрөл** | REST API + Event Producer (Kafka, Redis) |
| **Эзэмшигч** | Research/Analytics баг |

**Хийдэг зүйл:** Хэрэглэгчийн browser-ийн үйл ажиллагааг (клик, скролл, хуудасны харалт) цуглуулж, PostgreSQL-д хадгалах, Kafka болон Redis руу дамжуулах clickstream analytics үйлчилгээ.

---

## 2.2 Архитектур

### Хамаарал (Dependencies)

- **PostgreSQL** — `raw_events` хүснэгтэд бүх event хадгалдаг (үндсэн store)
- **Redis** _(заавал биш)_ — `ca:events:{visitor_id}` queue болон `ca:diagnosis:queue`
- **Kafka** _(заавал биш)_ — `raw_events` topic руу publish хийдэг
- **Session Service** _(заавал биш)_ — HTTP POST-оор event дамжуулдаг

### Дата урсгал

```
Browser (track.js) → POST /track (X-API-Key header)
  → APIKeyAuthMiddleware (tier T1/T2/T3 тодорхойлох)
  → save_event() → PostgreSQL raw_events
  → Async fan-out: Redis LPUSH + Kafka publish + Session Service HTTP POST
```

---

## 2.3 API Лавлагаа

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

### Authentication — Tier системийн тайлбар

Observer нь 3 түвшний API key ашиглан field-level access control хийдэг:

| Tier | Key Prefix | Талбарын тоо | Зорилго |
|------|-----------|-------------|---------|
| T3 | `tk_basic_` | 23 | Үндсэн page analytics, мэдрэмжгүй дата |
| T2 | `tk_smart_` | 43 | E-commerce engagement, UX аналитик |
| T1 | `tk_full_` | 54 | Бүрэн checkout flow, cart, payment дата |

---

## 2.4 Өгөгдлийн загвар

### Үндсэн хүснэгт: `raw_events`

| Баганы нэр | Төрөл | Тайлбар |
|-----------|-------|---------|
| `id` | BIGSERIAL PK | Автоматаар нэмэгдэх ID |
| `event_id` | TEXT UNIQUE | Давхардал хаах unique ID |
| `visitor_id` | TEXT | Анонимос хэрэглэгчийн ID (localStorage) |
| `session_id` | TEXT | Session identifier |
| `event_type` | TEXT | `page_view`, `click`, `scroll`, `session_end`... |
| `url` | TEXT | Хуудасны URL |
| `ip` | TEXT | Хэрэглэгчийн IP (Observer-оос нэмэгддэг) |
| `payload` | JSONB | Tier-ийн дагуу шүүгдсэн нэмэлт талбарууд |
| `tier` | TEXT | T1 / T2 / T3 |
| `created_at` | TIMESTAMPTZ | Бүртгэгдсэн цаг |

---

## 2.5 Тохиргоо

| Хувьсагч | Шаардлагатай | Үндсэн утга | Тайлбар |
|---------|-------------|------------|---------|
| `DATABASE_URL` | Тийм | — | PostgreSQL холболт |
| `REDIS_URL` | Үгүй | (тогтоогдоогүй) | Redis холболт |
| `KAFKA_BOOTSTRAP_SERVERS` | Үгүй | (тогтоогдоогүй) | Kafka broker хаяг |
| `SESSION_SERVICE_URL` | Үгүй | (тогтоогдоогүй) | Session Service HTTP endpoint |
| `OBSERVER_CORS_ORIGINS` | Үгүй | `*` | CORS зөвшөөрөгдсөн origin-ууд |
| `OBSERVER_API_KEYS` | Үгүй | (тогтоогдоогүй) | Зөвшөөрөгдсөн key-үүдийн жагсаалт |
| `OBSERVER_ADMIN_KEY` | Үгүй | (тогтоогдоогүй) | Admin endpoint-ийн нууц key |

---

## 2.6 Локалд ажиллуулах

**Шаардлага:** Python 3.11+, PostgreSQL 14+, Redis 7+ _(заавал биш)_, Kafka 3+ _(заавал биш)_

```bash
git clone <repo-url> && cd observer_experiment
pip install -r requirements.txt
cp .env.example .env        # DATABASE_URL болон бусдыг тохируулна
psql -U postgres -c 'CREATE DATABASE observer_experiment;'
uvicorn observer.main:app --host 0.0.0.0 --port 8001 --reload
```

:::info
Эхний ажиллуулалтад `init_db()` функц автоматаар `raw_events` хүснэгт болон index-үүдийг үүсгэнэ.
:::

- **Локал URL:** http://localhost:8001
- **Viewer UI:** http://localhost:8001/viewer

---

## 2.7 Deployment

- Docker container (`python:3.11-slim`) дотор Uvicorn ажиллуулдаг
- PostgreSQL заавал эхлээд асаасан байх ёстой; Redis/Kafka заавал биш (graceful degradation)
- CI/CD: Репозиторид тодорхой pipeline олдсонгүй — мануал deploy хийх боломжтой

---

## 2.8 Мониторинг & Алдааны шийдэл

| HTTP код | Утга | Тайлбар |
|---------|------|---------|
| 200 | Амжилттай | Event амжилттай бүртгэгдлээ |
| 401 | Зөвшөөрөлгүй | API key алдаатай эсвэл байхгүй |
| 403 | Хориотой | Admin key буруу |
| 422 | Баталгаажуулалтын алдаа | Payload формат буруу |
| 503 | Үйлчилгээ боломжгүй | PostgreSQL унасан эсвэл admin key тохиргоогүй |

---

## 2.9 Архитектурын шийдвэрүүд (ADRs)

- **Python + FastAPI:** Async-first framework, I/O-heavy event processing-д тохиромжтой
- **PostgreSQL:** ACID баталгаа, `event_id` unique constraint, JSONB GIN index
- **3-Tier model:** Мэдрэмжтэй дата (cart, payment)-ыг T1 tier-т зөвхөн хадгалдаг
- **Fire-and-forget fan-out:** Kafka/Redis алдаа гарсан ч PostgreSQL-д event хадгалагдана

---

## 2.10 Changelog

**Одоогийн хувилбар:** 2.0.0 (`observer/__init__.py`)

- **v1→v2:** Tier column, `event_id` unique constraint, payload JSONB шүүлт нэмэгдсэн
- Migration гарын авлага: CHANGELOG хэсэгт тодорхой заасан байна
