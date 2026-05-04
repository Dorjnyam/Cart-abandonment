---
id: intro
title: Main Service — Тойм
sidebar_label: Тойм
---

# Main Service

| | |
|---|---|
| **Port** | 8000 |
| **Технологи** | Python 3.12, Django 5.1, DRF, SimpleJWT, Celery, Redis, PostgreSQL, DuckDB, Kafka, MinIO/S3, Google Gemini |
| **Төрөл** | REST API + Celery worker + Kafka consumer |
| **Хийдэг зүйл** | Multi-tenant SaaS backend — Observer event-ийг S1-S7 behavioral scoring хийж, Gemini AI-аар Монгол recommendation гаргаж, dashboard API өгдөг |

## Дата урсгал

```mermaid
graph TD
    OBS["Observer Service"] -->|"POST /track
X-API-Key"| REDIS[("Redis
ca:diagnosis:queue")]
    ML["ML Service"] -->|"Kafka: prediction_done"| KAFKA[["Kafka"]]
    REDIS -->|"2s interval"| CELERY["Celery Worker
consume_ca_diagnosis_queue"]
    KAFKA --> CELERY2["Celery
process_prediction"]
    CELERY --> OBSDB[("Observer DB
raw_events — read only")]
    CELERY --> SCORE["S1-S7 Scoring
+ Google Gemini"]
    SCORE --> PG[("PostgreSQL
Diagnosis + Recommendation")]
    CELERY2 --> PG2[("PostgreSQL
PredictionResult")]
    CELERY2 --> DUCK[("DuckDB
analytics aggregate")]
    CA["CartAnalytics Frontend"] -->|"REST API / JWT"| MAIN["Main Service :8000"]
    MAIN --> PG
```

## Celery Beat — Scheduled Jobs

| Давтамж | Task | Тайлбар |
|---------|------|---------|
| 2 секунд | `consume_ca_diagnosis_queue_once` | Redis queue дамжуулалт |
| 30 секунд | `poll_unprocessed_sessions` | Observer DB шалгах |
| Өдөр бүр 01:00 UTC | `export_predictions_daily` | MinIO Parquet export |
