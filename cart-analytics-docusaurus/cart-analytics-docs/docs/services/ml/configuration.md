---
id: configuration
title: ML тохиргоо
sidebar_label: Тохиргоо
---

# Тохиргоо

| Хувьсагч | Үндсэн утга | Тайлбар |
|---|---|---|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka broker |
| `KAFKA_INPUT_TOPIC` | `feature_ready` | Оролтын topic |
| `KAFKA_OUTPUT_TOPIC` | `prediction_done` | Гаралтын topic |
| `MODEL_PATH_XGBOOST` | `./models/xgb_cart_abandonment.joblib` | Active XGBoost model файл |
| `ABANDON_THRESHOLD` | model artifact-аас | Abandon classification cutoff |
| `SHAP_ENABLED` | optional | Top feature explanation support |

LSTM-тэй холбоотой хуучин env var байж болох ч MVP active inference path-д ашиглагдахгүй. Thesis-д LSTM-г future work гэж тайлбарлана.
