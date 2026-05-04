---
sidebar_position: 9
title: Хавсралт — Нийтлэг лавлагаа
---

# Хавсралт — Нийтлэг лавлагаа

## 9.1 Kafka Topic-үүдийн бүрэн жагсаалт

| Topic нэр | Producer | Consumer | Зорилго |
|----------|---------|---------|---------|
| `raw_events` | Observer Service | Session Service | Хэрэглэгчийн browser event |
| `session_enriched` | Session Service | Feature Service | Баяжуулсан session snapshot |
| `feature_ready` | Feature Service | ML Prediction Service | 76-field feature vector |
| `prediction_done` | ML Service | Main Service | Legacy prediction result |
| `prediction_done_v2` | ML Service | Main Service | V2 prediction result (шинэ) |

:::tip
Consumers нь `prediction_done`-оос `prediction_done_v2` руу шилжихийг зөвлөж байна.
:::

---

## 9.2 Port-уудын жагсаалт

| Port | Үйлчилгээ | Тайлбар |
|------|----------|---------|
| 8000 | [Main Service (Django)](./06-main-service) | Dashboard API + Auth |
| 8001 | [Observer Service (FastAPI)](./02-observer-service) | Event ingestion |
| 8002 | [Session Service (FastAPI)](./03-session-service) | Session accumulation |
| 8003 | [Feature Service (FastAPI)](./04-feature-service) | Feature computation sidecar |
| 8004 | [ML Prediction Service (FastAPI)](./05-ml-prediction-service) | Prediction API + inference |
| 3000 | [KICKLAB](./07-kicklab) / [CartAnalytics Frontend](./08-cartanalytics) | Next.js web apps |

---

## 9.3 Нийтлэг алдааг шийдвэрлэх алхамууд

**Алхам 1:** `GET /health` эсвэл `GET /viewer/status` — аль dependency-үүд унасан эсэхийг шалгах

**Алхам 2:** Docker log эсвэл terminal stdout шалгах
```bash
docker logs <container_name> --tail 100
```

**Алхам 3:** Kafka connectivity шалгах
```bash
nc -zv <broker> 9092
```

**Алхам 4:** Redis connectivity шалгах
```bash
redis-cli PING
```

**Алхам 5:** PostgreSQL шалгах
```bash
psql "$DSN" -c "SELECT 1;"
```

---

## 9.4 Хөгжүүлэлт хийхэд анхаарах зүйлс

- **Event давхардал:** Observer-д `OBSERVER_DEDUPE_EVENT_ID=true` тохируулна
- **Session Service:** Celery worker болон API нэг Redis/Kafka/Postgres env ашиглах ёстой
- **ML Service:** Model файлууд `./models/` хавтаст байх ёстой — startup-д шаардагдана
- **Main Service:** Observer DB read-only alias — бичих оролдлого хийхгүй
- **CartAnalytics Frontend:** `NEXT_PUBLIC_*` env var-ууд browser bundle-д харагдана — нууц мэдээлэл орхихгүй

---

## 9.5 Хурдан эхлэх — Local Stack

Бүх үйлчилгээг локалд ажиллуулахын тулд дараах дарааллыг баримтлана:

```
1. PostgreSQL + Redis + Kafka → Docker-ээр эхлүүлнэ
2. Observer Service      (port 8001)
3. Session Service       (port 8002) + Celery worker
4. Feature Service       (port 8003)
5. ML Prediction Service (port 8004)  ← models/ байх ёстой
6. Main Service          (port 8000) + Celery worker + beat
7. KICKLAB / CartAnalytics (port 3000)
```

:::warning
Observer Service PostgreSQL холболтгүй бол эхлэхгүй. Бусад dependencies (Redis, Kafka) graceful degradation-тай.
:::
