---
id: intro
title: Session Service — Тойм
sidebar_label: Тойм
---

# Session Service

| | |
|---|---|
| **Port** | 8002 |
| **Технологи** | Python 3.11, FastAPI + Uvicorn, Celery, asyncpg, aiokafka, redis-py async |
| **Төрөл** | Hybrid — REST API + Kafka consumer + Celery worker |
| **Хийдэг зүйл** | Raw event-үүдийг Redis-д хуримтлуулж, 30/60/90s window-оор enriched snapshot Kafka руу илгээж, PostgreSQL-д хадгалдаг |

## Дата урсгал

```mermaid
graph TD
    OBS["Observer Service"]
    KAFKA_IN[["Kafka: raw_events"]]
    CONS["Session Consumer (aiokafka)"]
    DEDUP{"Dedup check\n(Redis SET NX)"}
    ACC["accumulate_event()\nRedis hash session:id"]
    CELERY["Celery Window Tasks\nT+30s / T+60s / T+90s"]
    KAFKA_OUT[["Kafka: session_enriched"]]
    FLUSH["flush_session()\n(beforeunload/TTL/purchase)"]
    PG[("PostgreSQL\nsessions.sessions")]

    OBS -->|"HTTP POST"| CONS
    OBS --> KAFKA_IN
    KAFKA_IN --> CONS
    CONS --> DEDUP
    DEDUP -->|"Шинэ event"| ACC
    ACC --> CELERY
    CELERY -->|"emit_session_enriched()"| KAFKA_OUT
    ACC --> FLUSH
    FLUSH --> KAFKA_OUT
    FLUSH --> PG
```
