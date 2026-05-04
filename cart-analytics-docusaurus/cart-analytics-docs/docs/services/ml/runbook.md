---
id: runbook
title: ML — Runbook
sidebar_label: Runbook
---

# Runbook

## Аюулгүй дахин эхлүүлэх

Manual commit (`enable_auto_commit=False`) тул Kafka offset хадгалагдана — дахин эхлүүлэхэд унших боломжтой.

## Hot-reload Model

Restart шаардлагагүй:

```bash
curl -X POST http://localhost:8004/model/reload
```

## Rollback

```bash
# 1. Өмнөх Docker image deploy
docker run ... ml-service:v1.0

# 2. Model файл солих
cp models/model_v1_xgboost_backup.pkl models/model_v1_xgboost.pkl

# 3. Hot-reload
curl -X POST http://localhost:8004/model/reload
```

## Model Training (offline)

```bash
python scripts/train.py
# cartdb PostgreSQL-ийн training data ашигладаг
# Trained model ./models/-д хадгалагдана
```
