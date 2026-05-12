---
title: Kafka өгөгдлийн урсгал
---

# Kafka topic-ууд

| Topic | Producer | Consumer | Payload |
|---|---|---|---|
| `raw_events` | Observer | Session | Ecommerce raw event |
| `session_enriched` | Session | Feature | Session state + aggregated fields |
| `feature_ready` | Feature | ML | Feature vector + business metadata |
| `prediction_done` | ML | Main | XGBoost prediction result |

Kafka retry/replay боломжтой тул Main `prediction_done` processing idempotent байх ёстой. Duplicate message ирсэн ч `update_or_create` duplicate diagnosis/recommendation үүсгэхгүй.
