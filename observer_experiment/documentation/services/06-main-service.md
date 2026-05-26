---
sidebar_position: 6
title: Main Service
---

# Main Service

## 6.1 Тойм

| | |
|---|---|
| **Нэр** | Main Service |
| **Port** | 8000 |
| **Технологи** | Python 3.12, Django 5.1, DRF, SimpleJWT, Celery, Redis, PostgreSQL, DuckDB, Kafka, MinIO/S3, Google Gemini API |
| **Үйлчилгээний төрөл** | REST API + Celery worker + Kafka consumer |

**Хийдэг зүйл:** Multi-tenant SaaS backend — Observer-ийн raw event-ийг уншиж, **7 хэмжигдэхүүний (S1-S7) behavioral scoring pipeline** ажиллуулж, Google Gemini-ийн тусламжтайгаар Монгол хэлний recommendation гаргаж, tenant-ийн dashboard-д REST API өгдөг.

---

## 6.2 Архитектур

```
Observer → POST /track (X-API-Key) → Redis: ca:diagnosis:queue
  → Celery: consume_ca_diagnosis_queue (2 секунд тутам)
  → process_session → Observer DB (raw_events унших)
  → extract_features → score_s1_s7 → Google Gemini
  → Diagnosis + Recommendation → PostgreSQL

ML Service → Kafka: prediction_done
  → Celery: process_prediction → PredictionResult → PostgreSQL
  → aggregate_session → DuckDB

Dashboard → GET/PATCH /api/analytics/* (JWT) → PostgreSQL + DuckDB
```

---

## 6.3 Үндсэн API Endpoint-үүд

### Auth endpoint-үүд _(Auth шаардлагагүй)_

| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/api/auth/register/` | Хэрэглэгч бүртгэх + tenant үүсгэх |
| POST | `/api/auth/login/` | Нэвтрэх → access + refresh token |
| POST | `/api/auth/logout/` | Refresh token blacklist хийх |
| POST | `/api/auth/token/refresh/` | Access token шинэчлэх |
| GET/PATCH | `/api/auth/profile/` | Профайл харах/засах |

### Analytics endpoint-үүд _(JWT шаардлагатай)_

| Арга | Зам | Тайлбар |
|------|-----|---------|
| GET | `/api/analytics/overview/` | Dashboard тойм метрик |
| GET | `/api/analytics/scores/` | S1-S7 оноогийн нийлбэр |
| GET | `/api/analytics/recommendation/` | Сүүлийн recommendation (автоматаар viewed болно) |
| PATCH | `/api/analytics/recommendation/{id}/implement/` | Хэрэгжсэн гэж тэмдэглэх |
| GET | `/api/sessions/` | Session жагсаалт (page) |
| GET | `/api/sessions/{id}/` | Session дэлгэрэнгүй + SHAP |
| GET | `/api/predictions/` | Prediction жагсаалт |
| GET | `/api/diagnosis/` | Diagnosis жагсаалт |
| POST | `/api/tenant/apikey/generate/` | API key үүсгэх |
| POST | `/api/export/` | MinIO export эхлүүлэх |
| GET | `/api/health/` | Health check |

### Observer ingest _(API Key шаардлагатай)_

| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/track` | Event хүлээн авах — X-API-Key header |

---

## 6.4 Өгөгдлийн загвар

| Model | Үндсэн талбарууд |
|-------|----------------|
| `Tenant` | `name`, `domain` (unique), `status`, `tier` (basic/smart/full) |
| `APIKey` | `tenant` FK, `key_hash` (SHA-256), `tier`, `is_active` |
| `TeamMember` | `tenant` FK, `user` FK, `role` (admin/owner/member/developer) |
| `Session` | `session_id` (unique), `visitor_id`, `tenant` FK, `event_count` |
| `PredictionResult` | `session` OneToOne, `prediction_score`, `predicted_class`, `shap_values` JSONB |
| `Diagnosis` | `tenant` FK, `session_id`, `score_s1~score_s7`, `status` |
| `Recommendation` | `diagnosis` OneToOne, `text_mn` (Монгол), `status` (created/viewed/implemented) |
| `ProcessedSession` | `observer_session_id` (unique) — идемпотент guard |

---

## 6.5 Тохиргоо

| Хувьсагч | Тайлбар |
|---------|---------|
| `DJANGO_SECRET_KEY` | Django secret key _(заавал)_ |
| `DATABASE_URL` | Үндсэн DB URL |
| `OBSERVER_DB_HOST/NAME/USER/PASSWORD` | Observer DB (read-only) |
| `REDIS_URL` | Redis холболт |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker |
| `KAFKA_PREDICTION_DONE_TOPIC` | `prediction_done` topic |
| `GEMINI_API_KEY` | Google Gemini API key (байхгүй бол static Монгол текст) |
| `MINIO_ENDPOINT` / `MINIO_BUCKET` | MinIO/S3 export зорилт |
| `DUCKDB_PATH` | DuckDB файлын зам |
| `FRONTEND_URL` | CORS зөвшөөрөгдсөн frontend URL |

---

## 6.6 Локалд ажиллуулах

```bash
pip install -r requirements.txt
cp .env.example .env                          # DB credentials тохируулна
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver                    # Web server :8000
celery -A main_service.celery:app worker -l info   # Worker
celery -A main_service.celery:app beat -l info     # Beat scheduler
python manage.py consume_prediction_done           # Kafka consumer
```

**Локал URL:** http://localhost:8000

---

## 6.7 Celery Beat — Scheduled Jobs

| Давтамж | Task | Тайлбар |
|--------|------|---------|
| 2 секунд тутам | `consume_ca_diagnosis_queue_once` | Redis diagnosis queue дамжуулалт |
| 30 секунд тутам | `poll_unprocessed_sessions` | Observer DB-ийг шалгах |
| Өдөр бүр 01:00 UTC | `export_predictions_daily` | Analytics → MinIO Parquet export |

---

## 6.8 Алдааны шийдэл

| Нөхцөл | HTTP | Шийдэл |
|--------|------|--------|
| Observer DB байхгүй | — | Graceful fallback, `visitor_id='unknown'` |
| Gemini API key байхгүй | — | Static Монгол recommendation текст |
| Celery task алдаа | — | 3 retry, exponential backoff (2s base) |
| Давхардсан session | — | `ProcessedSession` idempotency guard алгасна |
| Developer recommendation хэрэгжүүлэх | 403 | Permission denied |

---

## 6.9 Архитектурын шийдвэрүүд (ADRs)

- **Django + DRF:** Хурдан хөгжүүлэлтэд тохиромжтой, diploma/thesis контекст
- **Dual processing path:** Redis push (Observer) + DB polling (Observer DB) — алдааны тэсвэрлэлт
- **DuckDB:** Fast local analytics aggregation, PostgreSQL-д OLAP ачаалал нэмэхгүй
- **Gemini fallback:** API key байхгүй ч system ажиллана — static Монгол текст
- **API key as SHA-256 hash:** Raw key нэг удаа л харуулагдана, зөвхөн hash хадгалагдана
