---
id: running-locally
title: Observer — Локалд ажиллуулах
sidebar_label: Локалд ажиллуулах
---

# Локалд ажиллуулах

## Шаардлага

- Python 3.11+
- PostgreSQL 14+
- Redis 7+ (заавал биш)
- Kafka 3+ (заавал биш)

## Алхам алхмаар

```bash
# 1. Clone хийж, dependency суулгах
git clone <repo-url>
cd observer_experiment
pip install -r requirements.txt

# 2. .env тохируулах
cat > .env << EOF
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/observer_experiment
OBSERVER_ADMIN_KEY=dev_secret
EOF

# 3. PostgreSQL database үүсгэх
psql -U postgres -c "CREATE DATABASE observer_experiment;"

# 4. Server ажиллуулах
uvicorn observer.main:app --host 0.0.0.0 --port 8001 --reload
```

**Локал URL:** http://localhost:8001  
**Viewer UI:** http://localhost:8001/viewer

## Шалгалт

```bash
# Health check
curl http://localhost:8001/health

# Test key үүсгэх
curl -X POST http://localhost:8001/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"tier":"T3"}'

# Event илгээх
curl -X POST http://localhost:8001/track \
  -H "X-API-Key: tk_basic_YOURKEY" \
  -H "Content-Type: application/json" \
  -d '{"event_type":"page_view","url":"http://example.com"}'
```

:::info Migration
Эхний ажиллуулалтад `init_db()` функц автоматаар `raw_events` хүснэгт болон index-үүдийг үүсгэнэ.
:::
