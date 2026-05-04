---
sidebar_position: 5
title: ML Prediction Service
---

# ML Prediction Service

## 5.1 Тойм

| | |
|---|---|
| **Нэр** | ML Prediction Service (`machine_learning_service`) |
| **Port** | 8004 |
| **Технологи** | Python 3.11/3.12, FastAPI, asyncpg, aiokafka, XGBoost, PyTorch (LSTM), SHAP |
| **Үйлчилгээний төрөл** | Hybrid — Kafka event consumer/producer + REST API |

**Хийдэг зүйл:** Kafka-ийн feature vector-ийг уншиж, **XGBoost + LSTM ensemble model**-ээр cart abandonment магадлал тооцоолж, PostgreSQL-д хадгалан, `prediction_done` topic руу нийтэлдэг.

---

## 5.2 Архитектур

```
Feature Service → Kafka: feature_ready
  → consumer.py (FeatureVector deserialize)
    → pipeline.py: XGBoost predict + SHAP + optional LSTM ensemble
      → db.py: INSERT → predictions.predictions (PostgreSQL)
      → producer.py: Kafka prediction_done + prediction_done_v2
```

---

## 5.3 API Лавлагаа

| Арга | Зам | Тайлбар | Auth |
|------|-----|---------|------|
| GET | `/health` | Model, consumer, producer статус | Үгүй |
| POST | `/predict` | Нэг feature vector-ийг синхрон prediction | Үгүй |
| GET | `/model/info` | Model хувилбар, feature нэр, threshold | Үгүй |
| POST | `/model/reload` | Disk-ийн model file дахин ачаалах | Үгүй |
| GET | `/viewer` | Dashboard UI | Үгүй |

### POST `/predict` — Request/Response

**Request body** (`FeatureVector` schema):
```json
{
  "session_id": "uuid",
  "features": { "...": "..." },
  "event_sequence": [0.1, "..."]
}
```

**Response** (`PredictionResult`):
```json
{
  "prediction_score": 0.73,
  "predicted_class": "abandoned|converted",
  "shap_values": { "...": "..." }
}
```

---

## 5.4 Өгөгдлийн загвар

### PostgreSQL: `predictions.predictions`

| Баганы нэр | Төрөл | Тайлбар |
|-----------|-------|---------|
| `prediction_id` | UUID PK | Auto-generated |
| `session_id` | UUID | Prediction-ийн session |
| `tenant_id` | UUID | Multi-tenant ID |
| `abandon_probability` | FLOAT | Score 0.0–1.0 |
| `diagnosis_category` | VARCHAR(30) | `abandoned` / `converted` |
| `shap_values` | JSONB | Top-N SHAP feature importance |
| `model_version` | VARCHAR(50) | Жишээ: `xgboost-v1` |

---

## 5.5 Тохиргоо

| Хувьсагч | Үндсэн утга | Тайлбар |
|---------|------------|---------|
| `PG_DSN` | _(шаардлагатай)_ | PostgreSQL холболт |
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka broker |
| `KAFKA_INPUT_TOPIC` | `feature_ready` | Оролтын topic |
| `KAFKA_OUTPUT_TOPIC` | `prediction_done` | Гаралтын legacy topic |
| `KAFKA_OUTPUT_TOPIC_V2` | `prediction_done_v2` | V2 гаралт |
| `MODEL_PATH_XGBOOST` | `./models/model_v1_xgboost.pkl` | XGBoost model файл |
| `MODEL_PATH_LSTM` | `./models/model_v1_lstm.pt` | LSTM model файл |
| `ABANDON_THRESHOLD` | `0.5` | Abandon classification cutoff |
| `ENSEMBLE_WEIGHT_XGBOOST` | `0.7` | XGBoost-ийн жин |
| `ENSEMBLE_WEIGHT_LSTM` | `0.3` | LSTM-ийн жин |

---

## 5.6 Локалд ажиллуулах

```bash
pip install -r requirements.txt
mkdir -p models/   # model .pkl ба .pt файлуудыг хуулна
uvicorn app.main:app --host 0.0.0.0 --port 8004 --workers 1
```

**Локал URL:** http://localhost:8004

---

## 5.7 Алдааны шийдэл

| Нөхцөл | Шийдэл |
|--------|--------|
| Model файл байхгүй | 503 — `./models/` шалгана, `MODEL_PATH_*` env var тохируулна |
| Kafka consumer crash | `SystemExit(1)` — fail-fast, container дахин эхлүүлнэ |
| LSTM ачаалагдаагүй | XGBoost-only mode — graceful degradation, `/model/info` шалгана |
| SHAP алдаа | Warning log, `shap_values={}` буцаана — критик биш |

---

## 5.8 Runbook

- **Аюулгүй дахин эхлүүлэх:** Manual commit тул Kafka offset хадгалагдана — дахин унших боломжтой
- **Hot-reload model:**
  ```bash
  POST /model/reload
  ```
  Restart шаардлагагүй.
- **Rollback:** Өмнөх Docker image deploy хийн, model файл солиж, `POST /model/reload` дуудна

---

## 5.9 Архитектурын шийдвэрүүд (ADRs)

- **XGBoost:** Tabular feature-д хурдан inference, SHAP-тай нийцтэй, missing value зохицдог
- **LSTM:** Event sequence data-д зориулсан optional ensemble component, 4-аас доош event байвал алгасна
- **Fail-fast consumer:** `SystemExit(1)`-ийг ашиглан supervisor/orchestrator restart хийдэг
- **Manual Kafka commit:** Failed prediction offset-ийг ахиулахгүй — at-least-once delivery

---

## 5.10 Changelog

**Одоогийн хувилбар:** `xgboost-v1` / `lstm-v1`

- **`prediction_done_v2`:** `visitor_id`, `predicted_class` enum, `confidence` label нэмэгдсэн
- Consumers нь `prediction_done`-оос `prediction_done_v2` руу шилжих зөвлөмж байна
