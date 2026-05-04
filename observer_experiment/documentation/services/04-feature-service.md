---
sidebar_position: 4
title: Feature Service
---

# Feature Service

## 4.1 Тойм

| | |
|---|---|
| **Нэр** | Feature Service (`feature_svc`) |
| **Port** | 8003 |
| **Технологи** | Python 3.11/3.12, FastAPI, aiokafka, Pydantic v2, Pandas, Uvicorn |
| **Үйлчилгээний төрөл** | Kafka event consumer + producer (HTTP sidecar FastAPI) |

**Хийдэг зүйл:** Kafka-ийн `session_enriched` topic-оос enriched session event-үүдийг уншиж, **76 талбарт behavioral feature vector** тооцоолж, ML-ийн хэрэглээнд зориулан `feature_ready` topic руу нийтэлдэг.

---

## 4.2 Архитектур

```
Session Service → Kafka: session_enriched
  → feature_svc (consume + тооцоолол)
    → Kafka: feature_ready
      → ML Prediction Service
```

---

## 4.3 API Лавлагаа

Feature Service нь REST API биш **Kafka worker** юм. FastAPI нь зөвхөн operational endpoint-үүдийг өгдөг:

| Арга | Зам | Тайлбар | Auth |
|------|-----|---------|------|
| GET | `/health` | Liveness + Kafka шалгалт | Үгүй |
| GET | `/viewer` | Debug UI | Үгүй |
| GET | `/viewer/status` | Runtime статус, статистик | Үгүй |

---

## 4.4 Өгөгдлийн загвар (Pydantic Models)

| Model | Тайлбар |
|-------|---------|
| `SessionEnriched` | Kafka-аас ирэх мессежийн бүтэц |
| `AggregatedFields` | Session Service-ийн ~55 pre-aggregated behavioral field |
| `FeatureSet` | 76 талбарт гаралтын feature vector |
| `FeatureVector` | `session_id`, `tenant_id`, `version`, `variant`, `computed_at` бүхий Kafka envelope |

---

## 4.5 Тохиргоо

| Хувьсагч | Үндсэн утга | Тайлбар |
|---------|------------|---------|
| `KAFKA_BOOTSTRAP` | `kafka:9092` | Kafka broker |
| `SESSION_ENRICHED_TOPIC` | `session_enriched` | Оролтын topic |
| `FEATURE_READY_TOPIC` | `feature_ready` | Гаралтын topic |
| `FEATURE_CONSUMER_GROUP` | `feature-svc-group` | Consumer group ID |
| `FEATURE_VERSION` | `1.0.0` | Feature vector дээр тэмдэглэгдэх хувилбар |
| `FEATURE_VARIANT` | `C` | Ablation variant: A, B, C, D |
| `FEATURE_SET` | `full` | `baseline` (9), `extended` (~29), `full` (76) |
| `PORT` | `8003` | HTTP sidecar port |
| `QUARTILE_BOUNDARIES` | `50.0,150.0,300.0` | Cart value quartile threshold |

---

## 4.6 Локалд ажиллуулах

```bash
pip install -r requirements.txt
# .env-д KAFKA_BOOTSTRAP=localhost:9092 тохируулна
python main.py
```

- **Локал URL:** http://localhost:8003
- **Debug UI:** http://localhost:8003/viewer

:::note
Migration болон seed data шаардлагагүй — stateless worker.
:::

---

## 4.7 Алдааны шийдэл

| Нөхцөл | Шийдэл |
|--------|--------|
| Kafka холбогдохгүй | `KAFKA_BOOTSTRAP` тохиргоо болон broker health шалгана |
| Malformed `session_enriched` | Pydantic validation алдаа, session алгасна, `failed` counter нэмэгдэнэ |
| Publish 3 retry-аас хэтэрсэн | DLQ байхгүй — мессеж алдагдана, log шалгана |

---

## 4.8 Архитектурын шийдвэрүүд (ADRs)

- **Ablation variants (A/B/C/D):** ML ablation study-д зориулсан env var-аар тохируулах боломжтой
- **`mongolian_trust_border`:** Монголын e-commerce хэрэглэгчдийн итгэмжлэгдэхгүй payment method илрүүлэх
- **Pydantic `extra='ignore'`:** Session Service-ийн нэмэлт internal field-үүдийг чимээгүй орхидог
- **DLQ байхгүй:** Failed message log бичиж орхидог — ирээдүйд DLQ нэмэх зөвлөмж байна

---

## 4.9 Changelog

**Одоогийн хувилбар:** 1.0.0 (`FEATURE_VERSION` env var)

- **Schema contract:** `schemas/feature_ready.json` — field нэмэх/хасахад `EXPECTED_FEATURE_COUNT` шинэчлэх шаардлагатай
