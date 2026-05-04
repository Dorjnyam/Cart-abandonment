---
sidebar_position: 2
title: Эхлэх заавар
---

# Эхлэх заавар

Энэ хуудас Observer сервисийг локал орчинд суулгаж, анхны event илгээх хүртэлх бүх алхмыг тайлбарлана.

---

## Шаардлага

| Хэрэгсэл | Хувилбар | Зориулалт |
|----------|---------|-----------|
| Python | 3.11+ | Сервисийн runtime |
| PostgreSQL | 14+ | Үндсэн өгөгдлийн сан |
| Redis | 7+ | Session queue (заавал биш) |
| Kafka | 3+ | Event streaming (заавал биш) |
| Docker | аливаа | Redis/Kafka хялбар асаахад |

:::tip
Redis болон Kafka байхгүй бол сервис ажиллана — зөвхөн PostgreSQL шаардлагатай.
:::

---

## 1. Репозиторийг татах

```bash
git clone <repository-url>
cd observer_experiment
```

---

## 2. Python орчин үүсгэх

```bash
# Conda ашиглах тохиолдолд
conda create -n observer python=3.11
conda activate observer

# эсвэл venv
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

---

## 3. Хамаарлуудыг суулгах

```bash
pip install -r requirements.txt
```

Гол хамаарлууд:

| Сан | Зориулалт |
|-----|-----------|
| `fastapi` | HTTP сервер |
| `uvicorn` | ASGI сервер |
| `asyncpg` | PostgreSQL async холболт |
| `redis[asyncio]` | Redis async клиент |
| `aiokafka` | Kafka async producer |

---

## 4. Орчны хувьсагч тохируулах

`.env` файл үүсгэж, дараах утгуудыг тохируулна:

```bash
# Заавал шаардлагатай
DATABASE_URL=postgresql://postgres:нууц_үг@localhost:5432/observer_experiment

# Заавал биш — байхгүй бол тухайн функц идэвхгүй болно
REDIS_URL=redis://localhost:6379/0
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SESSION_SERVICE_URL=http://localhost:8002/ingest/raw-event
```

:::caution Анхаар
`DATABASE_URL`-д тусгай тэмдэгт (`@`, `$`, `#` гэх мэт) байвал URL encode хийх шаардлагатай. Жишээ: `$` → `%24`.
:::

---

## 5. PostgreSQL өгөгдлийн сан үүсгэх

```sql
-- psql-д нэвтэрч ажиллуулна
CREATE DATABASE observer_experiment;
```

Хүснэгтүүдийг сервис эхлэхэд **автоматаар** үүсгэнэ (`observer/database.py` → `init_db()`).

---

## 6. Infrastructure асаах (Docker)

```bash
# Redis
docker run -d --name observer-redis -p 6379:6379 redis:7-alpine

# Kafka (нэмэлт)
docker run -d --name observer-kafka -p 9092:9092 \
  -e KAFKA_CFG_ZOOKEEPER_CONNECT=zookeeper:2181 \
  bitnami/kafka:latest
```

---

## 7. Сервис асаах

```bash
PYTHONIOENCODING=utf-8 uvicorn observer.main:app \
  --host 0.0.0.0 --port 8001 --reload
```

Амжилттай асвал дараах мэдэгдэл харагдана:

```
=======================================================
  Observer Experiment — PostgreSQL (tiered keys)
=======================================================
  Health:  GET  /health
  Ingest:  POST /events  (alias: /collect)
  Viewer:  http://localhost:8001/viewer
  Redis:   ON  (LPUSH ca:events:*, ca:diagnosis:queue)
  Kafka:   ON  (topic=raw_events)
=======================================================
```

---

## 8. Ажиллаж байна уу шалгах

### Health check

```bash
curl http://localhost:8001/health
```

Хүлээгдэж буй хариу:

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

## 9. Анхны event илгээх

### API түлхүүр үүсгэх

```bash
curl -X POST http://localhost:8001/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"tier": "T1"}'
```

Хариу:

```json
{
  "key": "tk_full_de736d5eae8ea07200ac4f5cdacd2f47",
  "tier": "T1"
}
```

### Test event илгээх

```bash
curl -X POST http://localhost:8001/track \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tk_basic_test",
    "event_type": "page_view",
    "session_id": "sess_001",
    "visitor_id": "vis_001",
    "url": "https://example.mn/products"
  }'
```

Хариу:

```json
{
  "status": "ok",
  "id": 1,
  "tier": "T3",
  "received_fields": ["event_type", "session_id", "visitor_id", "url", "ip", "user_agent"],
  "payload_field_count": 0
}
```

---

## 10. Viewer нээх

Хөтөч дээр `http://localhost:8001/viewer` нээнэ. Viewer дараах табуудтай:

| Таб | Агуулга |
|-----|---------|
| **Events** | Сүүлийн event-үүдийн хүснэгт, шүүлтүүртэй |
| **Stats** | Нийт тоо, event_type-ийн хуваарилалт |
| **Sessions** | Session бүрийн хураангуй |
| **Visitors** | Visitor бүрийн түүх |
| **Tier Inspect** | Payload талбарын coverage шинжилгээ |
| **Field Catalog** | 54 талбарын нэр, tier, sector |
| **SQL** | Зөвхөн SELECT query ажиллуулах |

---

## Дараагийн алхам

- [track.js сайтдаа оруулах](/docs/integration) — бодит сайтад суурилуулах заавар
- [API лавлах](/docs/reference/api) — бүх endpoint-ийн тайлбар
- [Tier систем](/docs/reference/fields/overview) — ямар талбар хаанаас ирдгийг ойлгох
