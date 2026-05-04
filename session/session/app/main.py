from __future__ import annotations

import asyncio
import contextlib
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import Body, FastAPI, Header, HTTPException
from fastapi.responses import FileResponse
import redis.asyncio as redis_async
import redis.asyncio as redis_dep
import asyncpg

from app.config import (
    CELERY_BROKER_URL,
    INGEST_API_KEY,
    KAFKA_BOOTSTRAP,
    REDIS_URL,
    SESSION_DEDUPE_EVENT_ID,
    SESSION_EVENT_SOURCE,
)
from app.assembler import flush_session, pop_expired_sessions
from app.consumer import (
    dedupe_key_from_observer_dict,
    process_raw_event,
    skip_if_duplicate,
    start_consumer,
)
from app.db import close_pool, get_pool
from app.emitter import close_producer
from app.logging_config import configure_logging
from app.monitor import monitor_session_enriched
from app.telemetry import get_events_since, get_snapshot, record_event
from app.observer_adapter import observer_message_to_raw_event, resolve_session_id

redis_client: redis_async.Redis | None = None
logger = logging.getLogger(__name__)


def _log_task_result(task: asyncio.Task[None]) -> None:
    if task.cancelled():
        return
    exc = task.exception()
    if exc is not None:
        logger.exception("Background task failed: %s", task.get_name(), exc_info=exc)


async def _heartbeat_sweeper(r: redis_async.Redis) -> None:
    expired_session_ids: list[str] = []
    while True:
        try:
            expired_session_ids = await pop_expired_sessions(r)
            for session_id in expired_session_ids:
                # Shield each flush so a SIGTERM arriving mid-flush does not leave a
                # partially-written session. The CancelledError is still propagated
                # after the current flush completes.
                await asyncio.shield(flush_session(r, session_id))
        except asyncio.CancelledError:
            # Drain any sessions already popped from ZSET before exiting cleanly.
            for session_id in expired_session_ids:
                with contextlib.suppress(Exception):
                    await flush_session(r, session_id)
            raise
        await asyncio.sleep(1)


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    global redis_client
    redis_client = redis_async.Redis.from_url(
        REDIS_URL,
        decode_responses=False,
        socket_timeout=5.0,
        socket_connect_timeout=5.0,
    )
    async with asyncio.TaskGroup() as tg:
        consumer_task = tg.create_task(start_consumer(redis_client), name="consumer")
        sweeper_task = tg.create_task(_heartbeat_sweeper(redis_client), name="sweeper")
        monitor_task = tg.create_task(monitor_session_enriched(), name="monitor")
        for task in (consumer_task, sweeper_task, monitor_task):
            task.add_done_callback(_log_task_result)

        try:
            yield
        finally:
            for task in (monitor_task, sweeper_task, consumer_task):
                task.cancel()
            results = await asyncio.gather(
                monitor_task, sweeper_task, consumer_task,
                return_exceptions=True,
            )
            for result in results:
                if isinstance(result, Exception) and not isinstance(result, asyncio.CancelledError):
                    logger.error("Task failed during shutdown: %s", result, exc_info=result)
            if redis_client is not None:
                await redis_client.aclose()
            await close_producer()
            await close_pool()


from app.metrics import metrics_app  # noqa: E402 — imported after FastAPI init to avoid circular

app = FastAPI(title="Session Service", lifespan=lifespan)
app.mount("/metrics", metrics_app())
VIEWER_FILE = Path(__file__).resolve().parents[2] / "viewer.html"


@app.get("/health")
async def health() -> dict[str, str | bool]:
    redis_ok = False
    kafka_ok = False

    if redis_client is not None:
        try:
            await redis_client.ping()
            redis_ok = True
        except Exception:
            pass

    kafka_result = await _check_kafka()
    kafka_ok = bool(kafka_result.get("ok"))

    status = "ok" if (redis_ok and kafka_ok) else "degraded"
    if not (redis_ok and kafka_ok):
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"status": status, "redis": redis_ok, "kafka": kafka_ok},
        )
    return {"status": status, "redis": redis_ok, "kafka": kafka_ok}


@app.get("/ready")
async def ready() -> dict[str, object]:
    redis_ok = False
    kafka_ok = False
    pg_ok = False

    if redis_client is not None:
        try:
            await redis_client.ping()
            redis_ok = True
        except Exception:
            pass

    kafka_ok = bool((await _check_kafka()).get("ok"))
    pg_ok = bool((await _check_postgres()).get("ok"))

    all_ok = redis_ok and kafka_ok and pg_ok
    status = "ready" if all_ok else "not_ready"
    if not all_ok:
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=503,
            content={"status": status, "redis": redis_ok, "kafka": kafka_ok, "postgres": pg_ok},
        )
    return {"status": status, "redis": redis_ok, "kafka": kafka_ok, "postgres": pg_ok}


@app.post("/ingest/raw-event")
async def ingest_raw_event(
    body: dict = Body(...),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, str | bool]:
    """
    Optional HTTP path: Observer forwards the same JSON as Kafka ``raw_events``.

    Set ``SESSION_INGEST_API_KEY`` on Session service to require ``X-API-Key``
    (same value as Observer ``SESSION_SERVICE_API_KEY``).
    """
    if SESSION_EVENT_SOURCE == "kafka":
        raise HTTPException(
            status_code=503,
            detail="HTTP ingest disabled when SESSION_EVENT_SOURCE=kafka. "
            "Unset Observer SESSION_SERVICE_URL or set SESSION_EVENT_SOURCE=both|http.",
        )
    if INGEST_API_KEY:
        if not x_api_key or x_api_key != INGEST_API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")

    if redis_client is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    event = observer_message_to_raw_event(body)
    if event is None:
        raise HTTPException(
            status_code=422,
            detail="Invalid event: need session_id, visitor_id (UUIDs), event_type",
        )

    if await skip_if_duplicate(
        redis_client,
        dedupe_key_from_observer_dict(body),
        duplicate_extra=body,
    ):
        return {"status": "ok", "duplicate": True}

    record_event("http_received", event.model_dump(mode="json"))
    await process_raw_event(redis_client, event)
    return {"status": "ok", "duplicate": False}


@app.post("/ingest/flush-session")
async def ingest_flush_session(
    body: dict = Body(...),
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> dict[str, str]:
    """
    Force final enriched emit (``window_seconds`` null) + Postgres write + Redis cleanup.
    """
    if INGEST_API_KEY:
        if not x_api_key or x_api_key != INGEST_API_KEY:
            raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")

    if redis_client is None:
        raise HTTPException(status_code=503, detail="Service not ready")

    if not isinstance(body, dict):
        raise HTTPException(status_code=422, detail="JSON object required")

    sid_raw = body.get("session_id")
    if sid_raw is None or (isinstance(sid_raw, str) and not sid_raw.strip()):
        raise HTTPException(status_code=422, detail="session_id required")

    session_id = resolve_session_id(sid_raw)
    if session_id is None:
        raise HTTPException(status_code=422, detail="invalid session_id")

    key = f"session:{session_id}"
    raw = await redis_client.hgetall(key)
    if not raw:
        raise HTTPException(status_code=404, detail="session not found in Redis")

    await flush_session(redis_client, session_id, end_reason="unload")
    record_event("final_flushed", {"session_id": session_id, "reason": "manual_flush"})
    return {"status": "ok", "session_id": session_id}


@app.get("/viewer")
async def viewer() -> FileResponse:
    return FileResponse(VIEWER_FILE)


async def _check_kafka() -> dict[str, str | bool]:
    bootstrap = KAFKA_BOOTSTRAP.split(",")[0].strip()
    host, port = bootstrap.split(":")
    try:
        reader, writer = await asyncio.wait_for(
            asyncio.open_connection(host, int(port)),
            timeout=2.0,
        )
        writer.close()
        await writer.wait_closed()
        return {"ok": True, "detail": f"tcp://{host}:{port} reachable"}
    except Exception as exc:
        return {"ok": False, "detail": str(exc)}


async def _check_redis(url: str) -> dict[str, str | bool]:
    # Reuse the already-open pool for the primary URL to avoid per-request connection churn.
    owned = not (url == REDIS_URL and redis_client is not None)
    client = redis_dep.Redis.from_url(url) if owned else redis_client
    try:
        await client.ping()
        return {"ok": True, "detail": "PING OK"}
    except Exception as exc:
        return {"ok": False, "detail": str(exc)}
    finally:
        if owned and client is not None:
            await client.aclose()


async def _check_postgres() -> dict[str, str | bool]:
    try:
        pool = await get_pool()
        value = await pool.fetchval("SELECT 1")
        return {"ok": bool(value == 1), "detail": "SELECT 1 OK"}
    except (asyncpg.PostgresError, OSError, ValueError) as exc:
        return {"ok": False, "detail": str(exc)}


@app.get("/viewer/status")
async def viewer_status() -> dict[str, object]:
    api = {"ok": True, "detail": "service running"}
    redis_dep_result = await _check_redis(REDIS_URL)
    celery_broker = await _check_redis(CELERY_BROKER_URL)
    kafka_dep = await _check_kafka()
    postgres_dep = await _check_postgres()
    snapshot = get_snapshot()
    return {
        "connections": {
            "api": api,
            "redis": redis_dep_result,
            "celery_broker": celery_broker,
            "kafka": kafka_dep,
            "postgres": postgres_dep,
        },
        "telemetry": snapshot,
        "session_config": {
            "SESSION_EVENT_SOURCE": SESSION_EVENT_SOURCE,
            "SESSION_DEDUPE_EVENT_ID": SESSION_DEDUPE_EVENT_ID,
        },
    }


@app.get("/viewer/events")
async def viewer_events(since: int = 0) -> dict[str, object]:
    events = get_events_since(since)
    return {"events": events, "snapshot": get_snapshot()}
