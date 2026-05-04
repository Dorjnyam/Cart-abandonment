---
id: configuration
title: Main — Тохиргоо
sidebar_label: Тохиргоо
---

# Тохиргоо

| Хувьсагч | Тайлбар |
|----------|---------|
| `DJANGO_SECRET_KEY` | Django secret key (**заавал**) |
| `DATABASE_URL` | Үндсэн PostgreSQL холболт |
| `OBSERVER_DB_HOST/NAME/USER/PASSWORD` | Observer DB (read-only alias) |
| `REDIS_URL` | Redis холболт |
| `CELERY_BROKER_URL` | Celery broker (default: REDIS_URL/0) |
| `KAFKA_BOOTSTRAP_SERVERS` | Kafka broker |
| `KAFKA_PREDICTION_DONE_TOPIC` | `prediction_done` |
| `GEMINI_API_KEY` | Google Gemini API key (байхгүй бол static Монгол текст) |
| `MINIO_ENDPOINT` | MinIO/S3 endpoint |
| `MINIO_BUCKET` | MinIO bucket нэр |
| `MINIO_ACCESS_KEY` | MinIO access key |
| `MINIO_SECRET_KEY` | MinIO secret key |
| `DUCKDB_PATH` | DuckDB файлын зам |
| `FRONTEND_URL` | CORS зөвшөөрөгдсөн frontend URL |
| `EMAIL_HOST/PORT/HOST_USER/HOST_PASSWORD` | SMTP тохиргоо |

:::warning Нууц мэдээлэл
`DJANGO_SECRET_KEY`, `DB_PASSWORD`, `GEMINI_API_KEY`, `MINIO_SECRET_KEY` нарыг `.env`-д хадгалж Git-т commit хийхгүй.
:::
