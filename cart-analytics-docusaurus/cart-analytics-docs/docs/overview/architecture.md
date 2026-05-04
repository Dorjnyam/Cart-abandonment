---
id: architecture
title: Системийн архитектур
sidebar_label: Архитектур
---

# Системийн архитектур

## Дата урсгалын диаграм

```mermaid
graph TD
    Browser["🌐 Browser / KICKLAB Web App\n(track.js snippet)"]
    OBS["Observer Service\n:8001\nPython/FastAPI"]
    SES["Session Service\n:8002\nFastAPI + Celery"]
    FEA["Feature Service\n:8003\nKafka Worker"]
    ML["ML Prediction Service\n:8004\nXGBoost + LSTM"]
    MAIN["Main Service\n:8000\nDjango + Celery"]
    CA["CartAnalytics Frontend\n:3000\nNext.js Dashboard"]

    PG1[("PostgreSQL\nraw_events")]
    PG2[("PostgreSQL\nsessions")]
    PG3[("PostgreSQL\npredictions")]
    PG4[("PostgreSQL\nmain DB")]
    REDIS[("Redis")]
    KAFKA[["Apache Kafka"]]
    DUCK[("DuckDB")]
    GEMINI["Google Gemini API"]

    Browser -->|"POST /track\nX-API-Key"| OBS
    OBS --> PG1
    OBS -->|"Kafka: raw_events"| KAFKA
    OBS -->|"Redis LPUSH"| REDIS
    KAFKA -->|"raw_events"| SES
    SES --> PG2
    SES --> REDIS
    SES -->|"Kafka: session_enriched"| KAFKA
    KAFKA -->|"session_enriched"| FEA
    FEA -->|"Kafka: feature_ready"| KAFKA
    KAFKA -->|"feature_ready"| ML
    ML --> PG3
    ML -->|"Kafka: prediction_done_v2"| KAFKA
    KAFKA -->|"prediction_done"| MAIN
    REDIS -->|"ca:diagnosis:queue"| MAIN
    MAIN --> PG4
    MAIN --> DUCK
    MAIN --> GEMINI
    CA -->|"REST API / JWT"| MAIN
```

## Үйлчилгээнүүдийн харилцаа

| Илгээгч | Protocol / Topic | Хүлээн авагч |
|---------|-----------------|--------------|
| Browser | HTTP POST `/track` | Observer Service |
| Observer | Kafka `raw_events` | Session Service |
| Observer | Redis LPUSH `ca:events:*` | Session/Main Service |
| Session | Kafka `session_enriched` | Feature Service |
| Feature | Kafka `feature_ready` | ML Prediction Service |
| ML Service | Kafka `prediction_done_v2` | Main Service |
| Main Service | REST API (JWT) | CartAnalytics Frontend |

## Kafka Topic-үүдийн бүрэн жагсаалт

| Topic нэр | Producer | Consumer | Зорилго |
|-----------|----------|----------|---------|
| `raw_events` | Observer Service | Session Service | Browser event |
| `session_enriched` | Session Service | Feature Service | Баяжуулсан session |
| `feature_ready` | Feature Service | ML Prediction Service | 76-field feature vector |
| `prediction_done` | ML Service | Main Service | Legacy prediction |
| `prediction_done_v2` | ML Service | Main Service | V2 prediction |
