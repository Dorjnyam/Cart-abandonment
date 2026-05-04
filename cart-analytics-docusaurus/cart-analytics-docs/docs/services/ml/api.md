---
id: api
title: ML — API Лавлагаа
sidebar_label: API
---

# API Лавлагаа

| Арга | Зам | Тайлбар | Auth |
|------|-----|---------|------|
| GET | `/health` | Model, consumer, producer статус | Үгүй |
| POST | `/predict` | Нэг feature vector-ийг synchronous prediction | Үгүй |
| GET | `/model/info` | Model хувилбар, feature нэр, threshold | Үгүй |
| POST | `/model/reload` | Disk-ийн model file дахин ачаалах | Үгүй |
| GET | `/viewer` | Dashboard UI | Үгүй |

## POST /predict

```json
// Request (FeatureVector)
{
  "session_id": "uuid",
  "tenant_id": "uuid",
  "features": { "rage_click_count": 3, "cart_value": 129.99 },
  "event_sequence": [0.1, 0.4, 0.8],
  "window_seconds": 60
}

// Response (PredictionResult)
{
  "session_id": "uuid",
  "prediction_score": 0.73,
  "predicted_class": "abandoned",
  "shap_values": { "rage_click_count": 0.18, "cart_value": 0.12 },
  "model_version": "xgboost-v1"
}
```

:::info OpenAPI
FastAPI автоматаар `/docs` болон `/redoc`-д OpenAPI spec үүсгэдэг.
:::
