---
id: troubleshooting
title: Observer — Алдааны шийдэл
sidebar_label: Troubleshooting
---

# Алдааны шийдэл

## Нийтлэг алдаанууд

| Алдааны шинж | Шалтгаан | Шийдэл |
|-------------|----------|--------|
| 401 on /track | API key буруу | Key generate: `POST /api/keys/generate` |
| Event хадгалагдахгүй | PostgreSQL холболт | `DATABASE_URL` шалгах |
| Kafka publish алдаа | Broker ажиллахгүй | `nc -zv localhost 9092` |
| Redis queue хоосон | Redis холболт | `redis-cli PING` |
| 422 validation | Талбарын нэр буруу | `/api/field-catalog` шалгах |

## Эхлээд шалгах

```bash
# 1. Health check
curl http://localhost:8001/health

# 2. Database
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM raw_events;"

# 3. Redis queue
redis-cli LLEN ca:diagnosis:queue

# 4. Key validation
curl -X POST http://localhost:8001/api/keys/validate \
  -H "Content-Type: application/json" \
  -d '{"key":"YOUR_KEY"}'
```
