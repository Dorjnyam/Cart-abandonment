# Main Service integration (Observer :8001)

Copy these modules into your **Main Service** project (e.g. FastAPI/Django on **localhost:8000**). They are **not** wired into the Observer app; Observer only **produces** Redis messages and stores events in PostgreSQL.

## Observer producer (already in this repo)

After each `/track` ingest, Observer calls [`observer/redis_queue.py`](../observer/redis_queue.py):

| Redis key | When | JSON body |
|-----------|------|-----------|
| `ca:events:{visitor_id}` | Every event | `session_id`, `event_type`, `tier`, `visitor_id` |
| `ca:diagnosis:queue` | `event_type == "session_end"` only | `session_id`, `visitor_id`, `tier` |

Lists use **LPUSH** on Observer side → your consumer should **BRPOP** `ca:diagnosis:queue` (FIFO order is newest-first popped last from list end — Redis list is stack-like with LPUSH/BRPOP from right; actually BRPOP pops from tail, LPUSH pushes to head, so you get FIFO for pipeline). *Correction:* `LPUSH` adds to head, `BRPOP` removes from tail → oldest item at tail is popped first → FIFO for queue semantics. Good.

TTL on `ca:events:*` is **86400** seconds.

Full event payloads live only in **`raw_events`** on the Observer database.

## Environment variables (Main Service process)

| Variable | Required | Purpose |
|----------|----------|---------|
| `OBSERVER_DATABASE_URL` | Yes (for DB fallback + loading session rows) | Read-only PostgreSQL URL to Observer DB |
| `MAIN_DATABASE_URL` | Yes | Your Main Service database (for `processed_sessions`) |
| `REDIS_URL` | No | If set and reachable, consumer uses **Redis mode** first; otherwise **DB polling** only |

Use a DB user on Observer with **SELECT** on `raw_events` only if you can.

## Main Service database

Run [`schema_processed_sessions.sql`](schema_processed_sessions.sql) on **Main** DB (not Observer).

## Files to copy

| File | Role |
|------|------|
| [`observer_db.py`](observer_db.py) | Read `raw_events` from Observer Postgres |
| [`diagnosis_consumer.py`](diagnosis_consumer.py) | `DiagnosisConsumer`: BRPOP loop or 30s poll + stub `_process_session` |
| [`schema_processed_sessions.sql`](schema_processed_sessions.sql) | DDL |
| [`requirements-consumer.txt`](requirements-consumer.txt) | `asyncpg`, `redis` for the consumer process |

After copying into a flat folder, change the import in `diagnosis_consumer.py` from `from integration.observer_db import ...` to `from observer_db import ...`.

## Running the consumer

**Option A — separate process (recommended)**

From **observer_experiment** repo root (after applying `schema_processed_sessions.sql` on Main DB):

```bash
set OBSERVER_DATABASE_URL=postgresql://...
set MAIN_DATABASE_URL=postgresql://...
set REDIS_URL=redis://localhost:6379/0
python -m integration.diagnosis_consumer
```

Use `DATABASE_URL` instead of `MAIN_DATABASE_URL` if you prefer.

**Option B — embed in FastAPI**

```python
@asynccontextmanager
async def lifespan(app):
    task = asyncio.create_task(DiagnosisConsumer().run())
    yield
    task.cancel()
```

Ensure shutdown cancels the task; do not block the event loop.

## Replace stubs

In `diagnosis_consumer.py`, implement inside `_process_session`:

1. Real feature extraction from `events`
2. S1–S7 scores
3. Gemini call
4. Persist to your own diagnosis tables (in the same transaction as `mark_processed`)

## Verification

1. Observer + Redis running; trigger `session_end` (close tab with snippet). Check Redis: `LLEN ca:diagnosis:queue` or `BRPOP`.
2. Start consumer → `processed_sessions` gains a row.
3. Unset `REDIS_URL` and restart consumer → within ~30s, polling should pick up unprocessed sessions that have `session_end` in Observer.

## Port summary

| Service | Default port |
|---------|----------------|
| Main Service (yours) | 8000 |
| Observer (this repo) | 8001 |
| Redis | 6379 |
| Observer PostgreSQL | 5432 (typical) |
