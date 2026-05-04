---
id: api
title: Session — API Лавлагаа
sidebar_label: API
---

# API Лавлагаа

| Арга | Зам | Тайлбар | Auth |
|------|-----|---------|------|
| GET | `/health` | Redis + Kafka liveness | Үгүй |
| POST | `/ingest/raw-event` | HTTP event хүлээн авах | X-API-Key (заавал биш) |
| POST | `/ingest/flush-session` | Session хүчээр дуусгах | X-API-Key (заавал биш) |
| GET | `/viewer` | Debug UI | Үгүй |
| GET | `/viewer/status` | Dependency health + telemetry | Үгүй |
| GET | `/viewer/events` | Сүүлийн 500 telemetry event | Үгүй |

## POST /ingest/flush-session

```json
// Request
{ "session_id": "<uuid>" }

// Response
{ "status": "ok", "session_id": "<uuid>" }
```

## Алдааны кодууд

| Код | Endpoint | Утга |
|-----|----------|------|
| 401 | /ingest/* | X-API-Key алдаатай |
| 404 | /ingest/flush-session | Session Redis-д байхгүй |
| 503 | /health | Redis эсвэл Kafka хүрч чадахгүй |
