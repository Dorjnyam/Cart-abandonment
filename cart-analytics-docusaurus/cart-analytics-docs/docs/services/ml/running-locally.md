---
id: running-locally
title: ML — Локалд ажиллуулах
sidebar_label: Локалд ажиллуулах
---

# Локалд ажиллуулах

```bash
# 1. Dependency суулгах
pip install -r requirements.txt

# 2. Model файлуудыг байрлуулах
mkdir -p models/
# model_v1_xgboost.pkl ба model_v1_lstm.pt файлуудыг хуулна

# 3. .env тохируулах
cp .env .env.local
# PG_DSN, KAFKA_BOOTSTRAP_SERVERS тохируулна

# 4. Ажиллуулах
uvicorn app.main:app --host 0.0.0.0 --port 8004 --workers 1
```

- **Локал URL:** http://localhost:8004
- Migration шаардлагагүй — startup-д auto-create

:::warning Model файл
`./models/` хавтаст `model_v1_xgboost.pkl` байхгүй бол service degraded mode-д эхэлнэ.
:::
