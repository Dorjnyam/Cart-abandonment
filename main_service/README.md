# Main Service (Django)

Энэ төсөл нь multi-tenant дэлгүүрүүдийн хэрэглээний үйл явдлыг (Observer -> `raw_events`) цуглуулж, Celery-р боловсруулан `S1-S7` оноо + Gemini зөвлөмж үүсгэж, Dashboard-д REST API-аар харуулах үндсэн үйлчилгээ юм.

## Товч ойлголт (хурдан урсгал)
1. `Tenant` болон `APIKey` үүсгэнэ (WF-01).
2. Observer тал event илгээж `raw_events` дүүргэнэ (WF-02) ба `session_end` дээр Redis queue рүү enqueue хийнэ.
3. Main Service-ийн Celery worker message-ийг авч `process_session` гүйцэтгэнэ (WF-03/04).
4. `raw_events` -> feature extraction -> `S1-S7` score -> Gemini -> `Diagnosis` + `Recommendation` хадгална (WF-05–07).
5. Dashboard API-уудаар `overview/scores/history/recommendation` татаж, recommendation үзсэн/хэрэгжүүлсэн status-ууд update хийнэ (WF-08–09).

## Урьдчилсан шаардлага
- Python (ж: 3.12)
- PostgreSQL (observer DB read хийхэд тусдаа холболт хэрэгтэй байж болно)
- Redis (заавал биш, гэхдээ queue mode болон хурдан processing-д хэрэгтэй)

## 1) Хамаарах package суулгах
```powershell
cd "C:\Users\dell\OneDrive\Desktop\main_service"
python -m pip install -r requirements.txt
```

## 2) Environment хувьсагч (заавал/сонголт)
`main_service/settings.py` нь дараахыг ашигладаг:

- `DJANGO_SECRET_KEY` (заавал биш, default байна)
- `DJANGO_DEBUG` (заавал биш; default `true`)
- `DJANGO_ALLOWED_HOSTS` (заавал биш; comma-аар хязгаарлалт)

### PostgreSQL (Main Service DB)
`DATABASE_URL` эсвэл `DB_*` env ашиглана.

- `DATABASE_URL` (ж: `postgres://user:pass@host:5432/main_service`)
- Эсвэл доорх `DB_*` (unset үед SQLite fallback):
  - `DB_HOST`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_PORT` (default `5432`)

### Observer DB alias (READ-ONLY гэж үзэх)
Observer DB read хийхэд:
- `OBSERVER_DB_HOST`
- `OBSERVER_DB_NAME`
- `OBSERVER_DB_USER`
- `OBSERVER_DB_PASSWORD`
- `OBSERVER_DB_PORT` (default `5432`)

### Redis / Celery
- `REDIS_URL` (default `redis://localhost:6379`)
- `CELERY_BROKER_URL` (default `${REDIS_URL}/0`)
- `CELERY_RESULT_BACKEND` (default `${REDIS_URL}/1`)

### Kafka (prediction_done bridge)
- `KAFKA_BOOTSTRAP_SERVERS` (comma-separated, ж: `localhost:9092`)
- `KAFKA_PREDICTION_DONE_TOPIC` (default `prediction_done`)
- `KAFKA_CONSUMER_GROUP` (default `main-service-predictions`)
- `KAFKA_TASK_TIMEOUT_SECONDS` (optional; wait time before giving up on Celery task)

### DuckDB
- `DUCKDB_PATH` (default `<BASE_DIR>/analytics.duckdb`)

### MinIO / S3 export
- `MINIO_ENDPOINT` (ж: `localhost:9000` эсвэл `s3.amazonaws.com`)
- `MINIO_BUCKET`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_USE_SSL` (`true`/`false`, default `false`)

### Gemini
- `GEMINI_API_KEY` (заавал биш)
Кey байхгүй үед Mongolian fallback зөвлөмж автоматаар ашиглагдана.

## 3) Migration хийх
```powershell
cd "C:\Users\dell\OneDrive\Desktop\main_service"
python manage.py makemigrations
python manage.py migrate
```

## 4) Superuser үүсгэх
```powershell
python manage.py createsuperuser
```

## 5) Run хийх
### Web server
```powershell
python manage.py runserver
```

### Celery worker
```powershell
celery -A main_service.celery:app worker -l info
```

### Celery beat (scheduler)
`WF-04` polling болон `WF-03` queue consume-ийн loop-г ажиллуулахын тулд:
```powershell
celery -A main_service.celery:app beat -l info
```

### Kafka consumer (prediction_done -> Celery)
```powershell
python manage.py consume_prediction_done
```

## Dashboard REST API (хамгийн хэрэгтэй endpoint-ууд)
Бүгд `/api/` prefix-тэй.

### Auth (SimpleJWT)
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `POST /api/auth/logout/`

SimpleJWT стандарт serializer тул **login** дээр `username` болон `password` ашиглаарай.

### Tenant (WF-01)
- `POST /api/admin/tenants/`
  - body: `{ "name": "...", "domain": "...", "tier": "basic|smart|full" }`
- `POST /api/tenant/apikey/generate/`
  - body: `{ "tier": "basic|smart|full", "suffix_len": 12 }` (suffix_len optional)
  - response-д `raw_key` + `observer_install_snippet` агуулагдана.

### Team (WF-10)
- `GET /api/team/` (tenant scoped)
- `POST /api/team/invite/`
  - body: `{ "tenant_id": 1, "email": "a@b.com", "role": "member|developer" }`

### Analytics (WF-08/09)
- `GET /api/analytics/overview/`
- `GET /api/analytics/scores/`
- `GET /api/analytics/history/`
- `GET /api/analytics/recommendation/`
- `GET /api/analytics/abandonment-rate/`
- `GET /api/analytics/feature-importance/`
  - `Recommendation.status` нь `created -> viewed` болж автоматаар шилжинэ.
- `PATCH /api/analytics/recommendation/{id}/implement/`
  - owner/member зөвшөөрөгдөнө
  - developer хориглогдоно

### Sessions + health
- `GET /api/sessions/` (paginated)
- `GET /api/sessions/{id}/` (session + SHAP)
- `GET /api/health/`

## Observer ingest contract (`/track`)
Main Service дотор Observer-ийн contract-г MVP маягаар симуляц хийнэ.

- URL: `POST /track` (эсвэл `POST /track/`)
- Header: `X-API-Key: <raw_key>`
- Body хамгийн багадаа:
```json
{
  "session_id": "uuid-or-string",
  "visitor_id": "uuid-or-string",
  "event_type": "page_view|session_end|...",
  "payload": { "..." : "..." }
}
```

`event_type == "session_end"` үед `ca:diagnosis:queue` рүү enqueue хийнэ.

## raw_events schema (Observer DB талд)
Processing хийх үед `raw_events` хүснэгтээс дараах талбаруудыг уншина:
- `tenant_id`
- `session_id`
- `visitor_id`
- `event_type`
- `payload` (JSON string гэж таамаглана)
- `created_at`

## Admin (Django Admin)
Дараах model-ууд admin дээр гарч байгаа:
- `tenants`: `Tenant`, `APIKey`, `TeamMember`
- `analytics`: `Diagnosis`, `Recommendation`, `ProcessedSession`
- `auth`: built-in `User`

Admin дээр `key_hash` нь sensitive тул товч masked preview хэлбэрээр харуулагдана.

## Тест ажиллуулах
```powershell
python manage.py test
```

