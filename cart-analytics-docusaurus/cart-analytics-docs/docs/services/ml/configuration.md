---
id: configuration
title: ML — Тохиргоо
sidebar_label: Тохиргоо
---

# Тохиргоо

| Хувьсагч | Үндсэн утга | Тайлбар |
|----------|------------|---------|
| `PG_DSN` | **(шаардлагатай)** | PostgreSQL холболт |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka broker |
| `KAFKA_INPUT_TOPIC` | `feature_ready` | Оролтын topic |
| `KAFKA_OUTPUT_TOPIC` | `prediction_done` | Legacy гаралт |
| `KAFKA_OUTPUT_TOPIC_V2` | `prediction_done_v2` | V2 гаралт |
| `MODEL_PATH_XGBOOST` | `./models/model_v1_xgboost.pkl` | XGBoost model файл |
| `MODEL_PATH_LSTM` | `./models/model_v1_lstm.pt` | LSTM model файл |
| `ABANDON_THRESHOLD` | `0.5` | Abandon classification cutoff |
| `ENSEMBLE_WEIGHT_XGBOOST` | `0.7` | XGBoost жин |
| `ENSEMBLE_WEIGHT_LSTM` | `0.3` | LSTM жин |
| `LSTM_MIN_SEQUENCE_LENGTH` | `4` | LSTM идэвхлэх min event тоо |
| `SHAP_BACKGROUND_SAMPLES` | `100` | SHAP background sample |
