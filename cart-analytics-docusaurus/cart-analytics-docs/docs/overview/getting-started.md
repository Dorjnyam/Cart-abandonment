---
id: getting-started
title: Эхлэлийн заавар
sidebar_label: Эхлэл
---

# Эхлэлийн заавар

## Шаардлагатай хэрэгслүүд

- **Docker Desktop** (PostgreSQL, Redis, Kafka-д)
- **Python 3.11+**
- **Node.js 18+**
- **pip** болон **npm**

## Port-уудын жагсаалт

| Port | Үйлчилгээ |
|------|-----------|
| 8000 | Main Service (Django) |
| 8001 | Observer Service (FastAPI) |
| 8002 | Session Service (FastAPI) |
| 8003 | Feature Service (FastAPI sidecar) |
| 8004 | ML Prediction Service (FastAPI) |
| 3000 | Web Apps (Next.js) |

## Ажиллуулах дараалал

:::caution Дараалал чухал
Үйлчилгээнүүдийг доорх дарааллаар ажиллуулна. Эхлээд infrastructure (Kafka, Redis, PostgreSQL) асаана.
:::

```bash
# 1. Infrastructure
docker compose up -d kafka redis postgres

# 2. Observer Service
cd observer && uvicorn observer.main:app --port 8001

# 3. Session Service
cd session && uvicorn app.main:app --port 8002
celery -A celery_app worker --loglevel=info

# 4. Feature Service
cd feature_svc && python main.py

# 5. ML Prediction Service
cd machine_learning_service && uvicorn app.main:app --port 8004

# 6. Main Service
cd main_service && python manage.py runserver
celery -A main_service.celery:app worker -l info
celery -A main_service.celery:app beat -l info
python manage.py consume_prediction_done

# 7. Web Apps
cd kicklab && npm run dev       # :3000
cd cart_analytic_web && npm run dev  # :3000
```

## Эрүүл мэндийн шалгалт (Health Check)

```bash
curl http://localhost:8001/health  # Observer
curl http://localhost:8002/health  # Session
curl http://localhost:8003/health  # Feature
curl http://localhost:8004/health  # ML
curl http://localhost:8000/api/health/  # Main
```

## Нийтлэг алдааг шийдвэрлэх алхамууд

1. `GET /health` эсвэл `GET /viewer/status` — аль dependency унасан эсэхийг шалгах
2. Docker log эсвэл terminal stdout шалгах
3. Kafka: `nc -zv <broker> 9092`
4. Redis: `redis-cli PING`
5. PostgreSQL: `psql "$DSN" -c "SELECT 1;"`
