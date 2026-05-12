---
title: prediction_done
---

# prediction_done

Producer: ML service. Consumer: Main service.

```json
{
  "session_id": "ab892586-560d-5dcd-9bff-59751b8bbf79",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "abandonment_probability": 0.699,
  "predicted_class": "abandoned",
  "model_name": "xgboost",
  "model_version": "xgboost-synthetic-mvp",
  "session_state": "ABANDONED",
  "has_purchase_success": false
}
```

Main service нь `has_purchase_success=true` эсвэл `session_state=CONVERTED` үед ML abandoned prediction-г business outcome болгон override хийхгүй. Prediction evidence хадгалагдана, diagnosis/recommendation үүсэхгүй.
