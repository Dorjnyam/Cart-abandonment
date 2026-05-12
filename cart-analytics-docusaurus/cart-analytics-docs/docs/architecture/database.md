---
title: Өгөгдлийн сан
---

# Өгөгдлийн сан

| Store | Ашиглалт |
|---|---|
| PostgreSQL | Observer raw events, Main dashboard data, predictions, diagnosis, recommendations. |
| Redis | Session TTL/state, readiness marker, lightweight queue/health state. |
| DuckDB | Main analytics trend/cache style aggregation fallback. |
| Kafka | Service хоорондын event streaming. |

PostgreSQL raw events нь Observer-ийн authoritative evidence store. Kafka unavailable байсан ч DB write амжилттай бол audit evidence үлдэнэ.
