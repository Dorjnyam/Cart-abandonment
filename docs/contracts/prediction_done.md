# prediction_done contract

## Purpose

`prediction_done` нь ML service-ийн XGBoost inference үр дүнг Main service рүү дамжуулдаг Kafka contract юм.

## Producer / Consumer

| Producer | Consumer |
|---|---|
| ML service | Main service prediction consumer |

## Topic

`prediction_done`

## Required fields

```json
{
  "session_id": "ab892586-560d-5dcd-9bff-59751b8bbf79",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "abandonment_probability": 0.699,
  "predicted_label": 1,
  "predicted_class": "abandoned",
  "model_name": "xgboost",
  "model_version": "xgboost-synthetic-mvp",
  "threshold": 0.39,
  "features": {},
  "top_features": [],
  "session_state": "ABANDONED",
  "has_purchase_success": false,
  "final_event_type": "abandon_checkout"
}
```

## Validation rules

- ML active inference нь XGBoost-only.
- `session_state`, `has_purchase_success`, `final_event_type` Main service-д бизнес үнэн төлөвөөр дамжина.
- Main service converted metadata-г ML prediction-ээс өндөр эрхтэй гэж үзнэ.

## Failure behavior

- Invalid JSON эсвэл required field дутуу бол DLQ рүү бичээд offset commit хийнэ.
- Main processing exception бол commit хийхгүй, message replay болно.
- `update_or_create` ашигладаг тул duplicate Kafka delivery duplicate diagnosis/recommendation үүсгэхгүй.

## Related tests

- `main_service/apps/analytics/tests.py`
- `scripts/audit/e2e_three_use_cases.py`
