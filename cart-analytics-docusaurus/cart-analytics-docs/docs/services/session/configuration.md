---
id: configuration
title: Session — Тохиргоо
sidebar_label: Тохиргоо
---

# Тохиргоо

## Environment Variables

| Хувьсагч | Үндсэн утга | Тайлбар |
|----------|------------|---------|
| `KAFKA_BOOTSTRAP_SERVERS` | `kafka:9092` | Kafka broker |
| `RAW_EVENTS_TOPIC` | `raw_events` | Оролтын topic |
| `SESSION_ENRICHED_TOPIC` | `session_enriched` | Гаралтын topic |
| `SESSION_CONSUMER_GROUP` | `session-svc-group` | Kafka consumer group |
| `REDIS_URL` | `redis://redis:6379/0` | Redis холболт |
| `CELERY_BROKER_URL` | REDIS_URL-тэй ижил | Celery broker |
| `PG_DSN` | `postgresql://...cartdb` | PostgreSQL холболт |
| `SESSION_TTL_SECONDS` | `1800` | Idle timeout (30 мин) |
| `SESSION_WINDOWS` | `30,60,90` | Snapshot window интервал |
| `BOT_THRESHOLD` | `0.7` | Bot score дээш байвал хаях |
| `SESSION_DEDUPE_EVENT_ID` | `true` | event_id-ээр давхардал хаах |
| `SESSION_INGEST_API_KEY` | (хоосон) | Тохируулбал /ingest-д key шаардана |

Config файл: `session/.env` (template: `session/.env.example`)
