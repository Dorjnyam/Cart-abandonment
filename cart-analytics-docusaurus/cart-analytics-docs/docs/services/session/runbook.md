---
id: runbook
title: Session — Runbook
sidebar_label: Runbook
---

# Runbook

## Аюулгүй дахин эхлүүлэх

Redis-д session state хадгалагдсан тул дахин эхлүүлэхэд дата алдагдахгүй.

```bash
# API stop
pkill -TERM uvicorn

# Celery worker stop
pkill -TERM celery

# Дахин эхлүүлэх
uvicorn app.main:app --host 0.0.0.0 --port 8002 &
celery -A celery_app worker --loglevel=info &
```

## DB Migration

```bash
psql "$PG_DSN" -f migrations/002_session_schema_fix.sql
# Бүх statement IF NOT EXISTS тул idempotent — аюулгүй
```

## Rollback

Өмнөх Docker image tag-г дахин deploy хийнэ. Redis state forward-compatible. Schema rollback script байхгүй.

## TTL Sweeper

`_heartbeat_sweeper` нь API process-ийн дотор asyncio task хэлбэрээр ажилладаг — 1 секунд тутам дуусгах ёстой session-ийг шалгана.
