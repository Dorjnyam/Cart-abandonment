---
id: running-locally
title: Session — Локалд ажиллуулах
sidebar_label: Локалд ажиллуулах
---

# Локалд ажиллуулах

```bash
# 1. .env тохируулах
cp session/.env.example session/.env
# PG_DSN, KAFKA_BOOTSTRAP_SERVERS, REDIS_URL тохируулна

# 2. Dependency суулгах
cd session && pip install -r requirements.txt

# 3. API сервер ажиллуулах (port 8002)
uvicorn app.main:app --host 0.0.0.0 --port 8002

# 4. Celery worker (тусдаа terminal)
celery -A celery_app worker --loglevel=info
```

- **Локал URL:** http://localhost:8002
- **Debug viewer:** http://localhost:8002/viewer
- Migration: `_ensure_schema()` автоматаар хийгдэнэ

:::warning Windows-д
Windows дээр Celery solo pool ашиглана: `celery_app.py`-д автоматаар тохируулагдсан байна.
:::
