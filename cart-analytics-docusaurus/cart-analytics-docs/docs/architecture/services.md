---
title: Сервисүүд
---

# Сервисүүдийн тайлбар

| Service | Port | Үүрэг |
|---|---:|---|
| Main service | 8000 | Dashboard API, prediction persistence, S1-S7 diagnosis, recommendation status. |
| Observer service | 8001 | Tracking endpoint, API key tier validation, raw event storage, Kafka producer. |
| Session service | 8002 | Session state machine, timeout flush, session_enriched producer. |
| Feature service | 8003 | Feature builder, feature order contract, feature_ready producer. |
| ML service | 8004 | XGBoost-only inference, prediction_done producer. |
| Demo ecommerce | 3000 | Deterministic thesis use case generator. |
| Analytics dashboard | 3001 | Real-data dashboard UI. |

Main service нь бизнесийн authority: converted guard, prediction override, recommendation status update энд баталгаажна.
