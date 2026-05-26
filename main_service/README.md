# Main Service

Main service нь Django дээр ажилладаг төв API юм. Энэ service tenant, API key, analytics session, prediction result, diagnosis, recommendation зэрэг dashboard-д хэрэгтэй өгөгдлийг хадгалж REST endpoint-оор гаргана.

## Үндсэн үүрэг

1. Demo tenant болон API key үүсгэнэ.
2. Observer database болон Kafka-аас ирсэн event/session мэдээллийг уншина.
3. Feature болон ML service-ээс ирсэн prediction result-ийг `PredictionResult` model-д хадгална.
4. S1-S7 оношлогоо болон recommendation үүсгэнэ.
5. Dashboard frontend-д `/api/` prefix-тэй endpoint-уудаар өгөгдөл өгнө.

## Шаардлага

- Python 3.12 орчим хувилбар
- PostgreSQL
- Redis, Celery
- Kafka
- Сонголтоор MinIO/S3 export

## Environment

`main_service/settings.py` дараах env утгуудыг уншина.

| Variable | Тайлбар |
|---|---|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | Local үед `true`, deployment үед `false` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated host list |
| `DATABASE_URL` | Main service database URL |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_PORT` | `DATABASE_URL` өгөөгүй үед ашиглах DB config |
| `OBSERVER_DB_HOST`, `OBSERVER_DB_NAME`, `OBSERVER_DB_USER`, `OBSERVER_DB_PASSWORD`, `OBSERVER_DB_PORT` | Observer DB-г read-only байдлаар унших config |
| `REDIS_URL` | Redis base URL |
| `CELERY_BROKER_URL` | Celery broker |
| `CELERY_RESULT_BACKEND` | Celery result backend |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker list |
| `KAFKA_PREDICTION_DONE_TOPIC` | Default: `prediction_done` |
| `KAFKA_CONSUMER_GROUP` | Default: `main-service-predictions` |
| `DUCKDB_PATH` | Local analytics export path |
| `GEMINI_API_KEY` | Байхгүй үед rule-based fallback recommendation ашиглана |

## Local ажиллуулах

```powershell
cd main_service
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Celery worker:

```powershell
celery -A main_service.celery:app worker -l info
```

Prediction consumer:

```powershell
python manage.py consume_prediction_done
```

Superuser хэрэгтэй бол:

```powershell
python manage.py createsuperuser
```

## Гол endpoint-ууд

Бүх endpoint `/api/` prefix-тэй.

| Endpoint | Тайлбар |
|---|---|
| `POST /api/auth/login/` | Dashboard login |
| `POST /api/auth/refresh/` | JWT refresh |
| `POST /api/auth/logout/` | Logout |
| `POST /api/admin/tenants/` | Tenant үүсгэх |
| `POST /api/tenant/apikey/generate/` | Observer API key үүсгэх |
| `GET /api/team/` | Tenant-ийн team member жагсаалт |
| `POST /api/team/invite/` | Team member нэмэх |
| `GET /api/analytics/overview/` | Dashboard KPI |
| `GET /api/analytics/scores/` | S1-S7 score |
| `GET /api/analytics/history/` | Trend |
| `GET /api/analytics/recommendation/` | Recommendation жагсаалт |
| `PATCH /api/analytics/recommendation/{id}/implement/` | Recommendation status update |
| `GET /api/sessions/` | Session жагсаалт |
| `GET /api/sessions/{id}/` | Нэг session-ийн detail |
| `GET /api/health/` | Service health |

## Observer ingest contract

Main service доторх Observer-compatible ingest endpoint нь MVP туршилтад ашиглагдана.

```http
POST /track
X-API-Key: <raw_key>
Content-Type: application/json
```

```json
{
  "session_id": "uuid-or-string",
  "visitor_id": "uuid-or-string",
  "event_type": "page_view",
  "payload": {}
}
```

`session_end` event ирэх үед diagnosis queue руу нэмэгдэнэ.

## Тест

```powershell
python manage.py test
```

Тест ажиллуулахын өмнө env болон test database тохиргоо зөв эсэхийг шалгана.
