---
id: deployment
title: Observer — Deployment
sidebar_label: Deployment
---

# Deployment

## Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8001
CMD ["uvicorn", "observer.main:app", "--host", "0.0.0.0", "--port", "8001"]
```

## Дарааллын шаардлага

1. **PostgreSQL** заавал эхлээд асаасан байх
2. Redis/Kafka — заавал биш (graceful degradation)
3. Session Service — заавал биш (Observer нь бие даан ажилладаг)

## Scaling

- **Horizontal scaling:** Stateless HTTP, хэд хэдэн instance ажиллуулж болно
- **PostgreSQL connection pool:** `min_size=2, max_size=10` (asyncpg)
- **Kafka partition:** `visitor_id`-ээр partition хийвэл ordering хадгалагдана
