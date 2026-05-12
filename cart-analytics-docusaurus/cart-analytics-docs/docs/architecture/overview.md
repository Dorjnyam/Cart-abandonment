---
title: Ерөнхий бүтэц
---

# Системийн ерөнхий архитектур

| Дараалал | Бүрэлдэхүүн | Үүрэг |
|---:|---|---|
| 1 | Demo ecommerce | UC1/UC2/UC3 event sequence илгээнэ. |
| 2 | Observer | `/track` event авч PostgreSQL `raw_events` болон Kafka `raw_events` рүү дамжуулна. |
| 3 | Session | Raw event-үүдийг session state болгон нэгтгэнэ. |
| 4 | Feature | Deterministic feature vector үүсгэнэ. |
| 5 | ML | XGBoost inference хийж `prediction_done` нийтэлнэ. |
| 6 | Main | Prediction хадгалж S1-S7 diagnosis, recommendation, dashboard API үүсгэнэ. |
| 7 | Analytics dashboard | Сесс, оношлогоо, зөвлөмжийг харуулна. |

## Өгөгдлийн урсгал

```text
Demo ecommerce
→ Observer
→ PostgreSQL raw_events
→ Kafka raw_events
→ Session
→ Kafka session_enriched
→ Feature
→ Kafka feature_ready
→ ML
→ Kafka prediction_done
→ Main
→ Dashboard API
→ Analytics dashboard UI
```
