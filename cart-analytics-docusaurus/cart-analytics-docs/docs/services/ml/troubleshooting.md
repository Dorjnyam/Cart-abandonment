---
id: troubleshooting
title: ML — Алдааны шийдэл
sidebar_label: Troubleshooting
---

# Алдааны шийдэл

| Нөхцөл | HTTP/Behavior | Шийдэл |
|--------|--------------|--------|
| Model файл байхгүй | 503 degraded | `./models/` шалгах, `MODEL_PATH_*` тохируулах |
| Kafka consumer crash | `SystemExit(1)` | Stdout log шалгах, container дахин эхлүүлэх |
| PostgreSQL байхгүй | RuntimeError | `PG_DSN` шалгах |
| LSTM ачаалагдаагүй | XGBoost-only | `/model/info`-д `lstm_loaded` шалгах |
| Prediction failure | Message not committed | Consumer log шалгах — дахин унших боломжтой |

```bash
# Health
curl http://localhost:8004/health

# Model info
curl http://localhost:8004/model/info

# Hot-reload model
curl -X POST http://localhost:8004/model/reload
```
