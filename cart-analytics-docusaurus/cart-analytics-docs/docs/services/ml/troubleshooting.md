---
id: troubleshooting
title: ML алдааны шийдэл
sidebar_label: Troubleshooting
---

# Алдааны шийдэл

| Нөхцөл | Behavior | Шийдэл |
|---|---|---|
| XGBoost model файл байхгүй | Health degraded эсвэл startup failure | `ml/models/` болон `MODEL_PATH_XGBOOST` шалгах |
| Kafka consumer crash | Consumer stopped | Container log шалгах, Kafka topic байгаа эсэхийг шалгах |
| Feature order mismatch | Prediction failure | `feature_order.json` болон Feature service payload шалгах |
| LSTM ачаалагдаагүй | Expected behavior | MVP active model нь XGBoost-only |
| Prediction failure | Message not committed | Consumer log шалгах, replay боломжтой |

```bash
curl http://localhost:8004/health
```
