---
title: XGBoost
---

# XGBoost active model

MVP active inference нь XGBoost-only.

| Талбар | Утга |
|---|---|
| Active model | `xgboost` |
| Model version | `xgboost-synthetic-mvp` |
| Ensemble | `xgb_only` |
| LSTM | Future work, active path-д ашиглагдахгүй |

ML service нь `feature_ready` payload авч XGBoost probability, threshold, predicted_label, top_features үүсгэнэ. Business truth override-г ML биш Main service хийдэг.
