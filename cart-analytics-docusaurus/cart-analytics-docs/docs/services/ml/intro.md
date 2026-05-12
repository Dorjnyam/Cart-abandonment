---
id: intro
title: ML Prediction Service тойм
sidebar_label: Тойм
---

# ML Prediction Service

|  |  |
|---|---|
| **Port** | 8004 |
| **Технологи** | Python 3.11, FastAPI, aiokafka, XGBoost, optional SHAP support |
| **Төрөл** | Kafka consumer/producer + REST API |
| **Хийдэг зүйл** | `feature_ready` payload авч XGBoost abandonment probability тооцоолж, `prediction_done` topic руу нийтэлдэг |

## Дата урсгал

```mermaid
graph TD
    FEA["Feature Service"] -->|"Kafka: feature_ready"| CONS["consumer.py"]
    CONS --> PIPE["pipeline.py\nXGBoost active\nLSTM disabled"]
    PIPE --> DB["db.py\nINSERT predictions"]
    PIPE --> PROD["producer.py\nKafka output"]
    DB --> PG[("PostgreSQL\npredictions")]
    PROD -->|"prediction_done"| KAFKA[["Kafka"]]
```

## Active model

MVP active inference нь XGBoost-only. `PredictionPipeline.lstm_loaded` false буцаадаг бөгөөд `lstm_score=null`, `ensemble_method=xgb_only` contract хадгалагдана.

LSTM code нь future work-д үлдсэн. Энэ MVP дээр LSTM training/evaluation artifact байхгүй тул active model гэж тайлбарлахгүй.
