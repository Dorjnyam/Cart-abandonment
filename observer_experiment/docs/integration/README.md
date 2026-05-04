---
title: Integration заавар
---

# Observer — Main Service Integration

Observer-ийн Redis болон PostgreSQL-тэй холбогдох Main Service-ийн template кодууд.

---

## Redis BRPOP consumer (session оношлогоо)

`session_end` үед Observer нь `ca:diagnosis:queue`-д JSON LPUSH хийнэ. Main Service BRPOP-оор хүлээнэ:

```python
import redis.asyncio as redis
import json

async def diagnosis_worker():
    r = redis.from_url("redis://localhost:6379/0")
    while True:
        # Блоклон хүлээнэ (5 секунд timeout)
        result = await r.brpop("ca:diagnosis:queue", timeout=5)
        if result is None:
            continue
        _, raw = result
        event = json.loads(raw)
        session_id = event.get("session_id")
        # Оношлогооны логик энд...
        await process_session(session_id)
```

---

## Observer PostgreSQL-ийг зөвхөн унших (read-only)

Main Service нь Observer-ийн `raw_events` хүснэгтийг унших эрхтэй байна:

```python
import asyncpg

async def get_session_events(session_id: str):
    conn = await asyncpg.connect(DATABASE_URL)
    rows = await conn.fetch(
        """
        SELECT event_type, payload, timestamp, tier
        FROM raw_events
        WHERE session_id = $1
        ORDER BY timestamp
        """,
        session_id
    )
    await conn.close()
    return [dict(r) for r in rows]
```

---

## `processed_sessions` хүснэгт (Main Service-д)

Observer-т хадгалахгүй — Main Service-ийн өөрийн DB-д үүсгэнэ:

```sql
CREATE TABLE processed_sessions (
    session_id      TEXT PRIMARY KEY,
    processed_at    TIMESTAMPTZ DEFAULT NOW(),
    diagnosis_score FLOAT,
    flags           JSONB
);
```

---

## Observer HTTP API-ийг дуудах

```python
import httpx

OBSERVER_URL = "http://localhost:8001"

async def get_visitor_history(visitor_id: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{OBSERVER_URL}/visitor/{visitor_id}")
        return r.json()

async def get_session_detail(session_id: str):
    async with httpx.AsyncClient() as client:
        r = await client.get(f"{OBSERVER_URL}/session/{session_id}")
        return r.json()
```

---

Дэлгэрэнгүй: [Observer API лавлах](/docs/reference/api) | [Архитектур](/docs/architecture)
