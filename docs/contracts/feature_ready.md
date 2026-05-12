# feature_ready contract

## Purpose

`feature_ready` нь Feature service-ийн deterministic ML feature vector ба business metadata-г ML service рүү дамжуулна.

## Producer / Consumer

| Producer | Consumer |
|---|---|
| Feature service | ML service |

## Topic

`feature_ready`

## Required fields

```json
{
  "session_id": "ab892586-560d-5dcd-9bff-59751b8bbf79",
  "tenant_id": "00000000-0000-0000-0000-000000000001",
  "version": "v1",
  "variant": "C",
  "features": {
    "page_load_ms": 7600,
    "rage_click": 5,
    "cart_value": 249000
  },
  "session_state": "ABANDONED",
  "has_purchase_success": false,
  "business_outcome": "abandoned"
}
```

## Validation rules

- Feature order нь ML training artifact `feature_order.json`-той таарах ёстой.
- Label/outcome талбарыг ML feature vector-т холихгүй.
- Missing/NaN/Inf утга 0 default болно.

## Failure behavior

Malformed message бол Feature consumer poison pill гэж үзээд commit хийж crash loop үүсгэхгүй. Publish failure бол commit хийхгүй, replay боломжтой.

## Related tests

- `feature/feature_svc/tests`
- `ml/tests/test_pipeline.py`
