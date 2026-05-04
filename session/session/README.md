# Session Service

Session Service accumulates `raw_events` into Redis session state, emits early snapshots to
`session_enriched` at 30/60/90 seconds, emits a final session on flush, and persists final
session state into PostgreSQL.

## Run

1. Create env file:
   - `copy .env.example .env` (Windows)
2. Install deps:
   - `pip install -r requirements.txt`
3. Start API + consumer:
   - `uvicorn app.main:app --host 0.0.0.0 --port 8002`
4. Start Celery worker (required for 30/60/90s snapshots):
   - `celery -A celery_app worker --loglevel=info`
   - On **Windows**, `celery_app.py` sets **`worker_pool=solo`** by default (prefork often raises `ValueError: not enough values to unpack` in trace_task). Override with env **`CELERY_WORKER_POOL`** if needed (e.g. `threads`).
   - On startup the worker should list `session.emit_window_snapshot` under `[tasks]`. If you see **“unregistered task … session.emit_window_snapshot”**, the worker process is not loading `app.scheduler` — ensure you use the project’s `celery_app.py` (it imports task modules after the Celery app is created).
   - Match the API’s **`REDIS_URL`**, **`KAFKA_BOOTSTRAP`**, **`CELERY_BROKER_URL`**, and **`CELERY_RESULT_BACKEND`** so tasks can read the session hash and publish enriched snapshots. **`PG_DSN`** is only required on the API for flush; mirroring it on the worker keeps one env block in Docker Compose.

## End-to-end pipeline (what runs where)

| Stage | Where | Notes |
|-------|--------|--------|
| Ingest | FastAPI + Kafka consumer | Dedupe, Redis `session:{id}` hash |
| Window snapshots | **Celery** `emit_window_snapshot` | Countdown uses `started_at` + 30/60/90s while those deadlines are still in the future. If the session hash is **stale** (all three deadlines already past), scheduling **re-anchors from server “now”** so new activity can still arm windows. Idempotency: Redis `session_winsched:{id}:{window}` (`SET NX`). After a successful Kafka emit, `snapshot_done_{window}` is set on the hash. |
| `session_enriched` | Celery → Kafka | API also starts an internal monitor consumer for viewer telemetry |
| Final flush + Postgres | API `flush_session` or sweeper | See below |

**Flush / Postgres:** `flush_session` runs when an event has `event_type` of `beforeunload` or `is_order_success`, or when the TTL sweeper removes an expired session from the deadline zset (session idle past `SESSION_TTL_SECONDS`). That emits a final enriched message (`window_seconds` null), writes `sessions.sessions`, and deletes Redis keys including `session_winsched:*` for that session.

**Manual flush (HTTP):** `POST /ingest/flush-session` with JSON `{"session_id": "<uuid or Observer id>"}` and optional `X-API-Key` if `SESSION_INGEST_API_KEY` is set. Same auth as `POST /ingest/raw-event`. Use this to finish a session without Observer close events (not blocked when `SESSION_EVENT_SOURCE=kafka`).

**Viewer (local):** After events are processed you should see `timers_scheduled` when at least one window was armed (often `[30, 60, 90]` or a subset if some deadlines already passed). With the **Celery worker** and Kafka up, `enriched_emitted` and `monitor_enriched_seen` increase when tasks fire.

**If `timers_scheduled` stays 0:** (1) Confirm a Celery worker is running with the same broker/Redis/Kafka as the API. (2) Clear stale session keys in Redis or use a new `session_id` if testing. (3) Check API logs for `window anchor: session deadlines past` (re-anchor from now should follow on the next event).

**If `timers_scheduled` > 0 but enriched stays 0:** Kafka unreachable from the worker, or producer errors (see `enriched_emit_failed`).

## Docker Compose Snippet

```yaml
session_svc:
  build: ./session
  ports:
    - "8002:8002"
  depends_on:
    - kafka
    - redis
  environment:
    KAFKA_BOOTSTRAP: kafka:9092
    REDIS_URL: redis://redis:6379/0
    PG_DSN: postgresql://user:pass@postgres:5432/cartdb
    HEARTBEAT_TIMEOUT: 1800
    BOT_THRESHOLD: 0.7
    SESSION_EVENT_SOURCE: both
    SESSION_DEDUPE_EVENT_ID: "1"
    CELERY_BROKER_URL: redis://redis:6379/0

celery_session_worker:
  build: ./session
  command: celery -A celery_app worker --loglevel=info
  depends_on:
    - redis
    - kafka
  environment:
    REDIS_URL: redis://redis:6379/0
    KAFKA_BOOTSTRAP: kafka:9092
    CELERY_BROKER_URL: redis://redis:6379/0
    CELERY_RESULT_BACKEND: redis://redis:6379/0
    PG_DSN: postgresql://user:pass@postgres:5432/cartdb
```

## Observer Experiment integration

Observer publishes flat JSON to Kafka topic `raw_events` and optionally POSTs the same body to Session Service.

**Avoid double-processing the same event:** If Observer enables both Kafka and HTTP forward for identical payloads, set `SESSION_EVENT_SOURCE=both` (default) and keep `SESSION_DEDUPE_EVENT_ID=1` so the first delivery with a given `event_id` wins; the other path increments `duplicate_skipped` and does not accumulate twice. Prefer a single path when possible: `SESSION_EVENT_SOURCE=kafka` and disable Observer HTTP forward, or `SESSION_EVENT_SOURCE=http` and rely only on POST (the Kafka consumer idles). If Session is `SESSION_EVENT_SOURCE=kafka` but Observer still POSTs, those requests get HTTP 503.

**Why it failed before:** Session expected `tenant_id` plus a nested `payload` object. Observer sends top-level fields only (no `tenant_id`). That is now mapped automatically.

**Requirements:**

- `session_id` and `visitor_id` may be Observer opaque strings (e.g. `s_...`, `v_...`). Those are mapped deterministically to UUIDv5 internally so Session can use UUID types everywhere.
- `tenant_id` is optional; if missing, `SESSION_DEFAULT_TENANT_ID` is used (see `.env.example`).

**Option A — Kafka (recommended)**

- Same broker host for both apps (e.g. `localhost:9092`).
- Observer: `KAFKA_BOOTSTRAP_SERVERS=localhost:9092`
- Session: `KAFKA_BOOTSTRAP_SERVERS=localhost:9092` or `KAFKA_BOOTSTRAP=localhost:9092` (either is read)

**Option B — HTTP forward**

Observer `.env`:

```env
SESSION_SERVICE_URL=http://localhost:8002/ingest/raw-event
SESSION_SERVICE_API_KEY=your_shared_secret
```

Session `.env` (must match if you use a key):

```env
SESSION_INGEST_API_KEY=your_shared_secret
```

## Phase 2 Validation Commands

1. Start Session API:
   - `uvicorn app.main:app --host 0.0.0.0 --port 8002`
2. Start Celery worker:
   - `celery -A celery_app worker --loglevel=info`
3. Produce test events to `raw_events` (first event, follow-ups, `beforeunload`/`is_order_success`).
4. Consume enriched output:
   - `kafka-console-consumer --bootstrap-server localhost:9092 --topic session_enriched --from-beginning`
5. Inspect Redis keys during live session:
   - `redis-cli keys "session:*"`
   - `redis-cli keys "session_winsched:*"` (idempotency keys for snapshot tasks; short TTL after each fire)
6. Verify Postgres final row:
   - `psql "$PG_DSN" -c "SELECT session_id, event_count, session_duration_sec, is_completed_purchase FROM sessions.sessions ORDER BY ended_at DESC LIMIT 10;"`
7. Optional — flush without `beforeunload` (same API key as ingest if configured):
   - `curl -s -X POST http://localhost:8002/ingest/flush-session -H "Content-Type: application/json" -d "{\"session_id\":\"YOUR_SESSION_UUID_OR_OBSERVER_ID\"}"`

Expected outcomes:
- Early snapshots appear around T+30, T+60, T+90 with `window_seconds` set to `30`, `60`, `90`.
- Final message has `window_seconds = null`.
- Final flush removes `session:{session_id}`, `session_winsched:*`, and legacy `session_timer:*` keys for that id.
- `is_completed_purchase` becomes true when `is_order_success` is processed.
- Events with `bot_score > BOT_THRESHOLD` are ignored.

## Database Migration Note

If your `sessions.sessions` table does not yet include a state column:

```sql
ALTER TABLE sessions.sessions
ADD COLUMN IF NOT EXISTS state text;
```
