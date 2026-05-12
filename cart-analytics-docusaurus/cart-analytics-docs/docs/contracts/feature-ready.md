---
title: feature_ready
---

# feature_ready

Producer: Feature service. Consumer: ML service.

`features` object нь XGBoost training `feature_order`-той нийцсэн deterministic vector байна. `session_state`, `has_purchase_success`, `business_outcome` зэрэг metadata нь ML feature vector-т холилдохгүй, Main service-ийн converted guard-д дамжина.

Validation:

- Missing value -> 0 default.
- Feature count mismatch бол error.
- Outcome label-г ML feature-д leak хийхгүй.
