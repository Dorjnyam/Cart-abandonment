---
id: configuration
title: Observer — Тохиргоо
sidebar_label: Тохиргоо
---

# Тохиргоо

## Environment Variables

| Хувьсагч | Шаардлагатай | Үндсэн утга | Тайлбар |
|----------|-------------|------------|---------|
| `DATABASE_URL` | **Тийм** | — | PostgreSQL холболт |
| `REDIS_URL` | Үгүй | (тогтоогдоогүй) | Redis холболт |
| `KAFKA_BOOTSTRAP_SERVERS` | Үгүй | (тогтоогдоогүй) | Kafka broker хаяг |
| `SESSION_SERVICE_URL` | Үгүй | (тогтоогдоогүй) | Session Service endpoint |
| `SESSION_SERVICE_TIMEOUT_MS` | Үгүй | `1500` | HTTP timeout (ms) |
| `OBSERVER_CORS_ORIGINS` | Үгүй | `*` | CORS origin-ууд |
| `OBSERVER_API_KEYS` | Үгүй | (тогтоогдоогүй) | Зөвшөөрөгдсөн key-үүд |
| `OBSERVER_ADMIN_KEY` | Үгүй | (тогтоогдоогүй) | Admin endpoint нууц key |

## .env файл жишээ

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/observer_experiment
REDIS_URL=redis://localhost:6379/0
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
SESSION_SERVICE_URL=http://localhost:8002/ingest/raw-event
OBSERVER_CORS_ORIGINS=http://localhost:3000,http://localhost:8001
OBSERVER_ADMIN_KEY=dev_secret_key_12345
```

:::warning Нууц мэдээлэл
`OBSERVER_ADMIN_KEY` болон `DATABASE_URL`-д байгаа нууц үгийг Git-т commit хийхгүй.
:::
