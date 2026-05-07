from __future__ import annotations

import asyncio
import logging
import os
import time
from contextlib import asynccontextmanager, suppress
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

import uvicorn
from aiokafka import AIOKafkaConsumer
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from prometheus_client import Counter, Gauge, Histogram, make_asgi_app
from pydantic import ValidationError

from config import (
    FEATURE_VARIANT,
    FEATURE_VERSION,
    KAFKA_BOOTSTRAP,
    LOG_LEVEL,
    PORT,
)
from features import FeatureComputer
from kafka_consumer import run_consumer
from kafka_producer import close_producer, emit_feature_vector, get_producer
from models import SessionEnriched

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger("feature_svc")

# ---------------------------------------------------------------------------
# Prometheus metrics
# ---------------------------------------------------------------------------
MSG_CONSUMED = Counter(
    "messages_consumed_total",
    "Total session_enriched messages consumed from Kafka",
)
FV_PRODUCED = Counter(
    "feature_vectors_produced_total",
    "Total FeatureVectors successfully published to feature_ready",
)
COMPUTE_FAILURES = Counter(
    "compute_failures_total",
    "Total feature computation failures",
)
PUBLISH_FAILURES = Counter(
    "kafka_publish_failures_total",
    "Total Kafka publish failures (after all retries)",
)
COMPUTE_DURATION = Histogram(
    "compute_duration_seconds",
    "Feature vector compute time in seconds",
    buckets=(0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0),
)
ACTIVE_COMPUTE = Gauge(
    "active_compute_tasks",
    "Number of sessions currently being computed",
)

# ---------------------------------------------------------------------------
# Runtime state
# ---------------------------------------------------------------------------
_consumer_task: asyncio.Task | None = None
_stats: dict[str, int] = {"processed": 0, "published": 0, "failed": 0}
_runtime: dict[str, object] = {
    "started_at": datetime.now(timezone.utc).isoformat(),
    "last_session_id": None,
    "last_published_session_id": None,
    "last_error": None,
}


def _required_env_status() -> dict[str, bool]:
    status = {
        "KAFKA_BOOTSTRAP": bool(os.environ.get("KAFKA_BOOTSTRAP")),
        "FEATURE_VERSION": bool(os.environ.get("FEATURE_VERSION")),
        "FEATURE_VARIANT": bool(os.environ.get("FEATURE_VARIANT")),
        "LOG_LEVEL": bool(os.environ.get("LOG_LEVEL")),
        "PORT": bool(os.environ.get("PORT")),
    }
    if FEATURE_VARIANT.upper() == "D":
        status["GRAPH_DB_DSN"] = bool(os.environ.get("GRAPH_DB_DSN"))
    return status


async def _tcp_check(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        conn = asyncio.open_connection(host, port)
        reader, writer = await asyncio.wait_for(conn, timeout=timeout)
        writer.close()
        await writer.wait_closed()
        del reader
        return True
    except Exception:
        return False


def _kafka_targets() -> list[tuple[str, int]]:
    targets: list[tuple[str, int]] = []
    for item in KAFKA_BOOTSTRAP.split(","):
        host_port = item.strip()
        if not host_port or ":" not in host_port:
            continue
        host, port_str = host_port.rsplit(":", 1)
        try:
            targets.append((host, int(port_str)))
        except ValueError:
            continue
    return targets


def _db_target() -> tuple[str, int] | None:
    dsn = os.environ.get("GRAPH_DB_DSN")
    if not dsn:
        return None
    parsed = urlparse(dsn)
    if parsed.hostname is None:
        return None
    return parsed.hostname, parsed.port or 5432


@asynccontextmanager
async def lifespan(app: FastAPI) -> None:
    # Startup
    global _consumer_task
    _consumer_task = asyncio.create_task(consume_loop())
    _consumer_task.add_done_callback(_log_consumer_task_failure)
    yield
    # Shutdown
    if _consumer_task:
        _consumer_task.cancel()
        with suppress(asyncio.CancelledError):
            await _consumer_task
    await close_producer()


def _log_consumer_task_failure(task: asyncio.Task) -> None:
    if task.cancelled():
        return
    exc = task.exception()
    if exc is not None:
        _runtime["last_error"] = f"{type(exc).__name__}: {exc}"
        logger.exception("Consumer task stopped unexpectedly", exc_info=exc)


app = FastAPI(lifespan=lifespan)
# Expose /metrics for Prometheus scraping
app.mount("/metrics", make_asgi_app())


async def consume_loop() -> None:
    feature_computer = FeatureComputer(FEATURE_VERSION, FEATURE_VARIANT)
    await get_producer()
    logger.info("Waiting for session_enriched messages...")

    async def _handle_message(payload: dict[str, object], consumer: AIOKafkaConsumer) -> None:
        session_id = "unknown"
        try:
            session = SessionEnriched(**payload)
            session_id = str(session.session_id)
            _runtime["last_session_id"] = session_id
            _stats["processed"] += 1
            MSG_CONSUMED.inc()
        except (ValidationError, KeyError, TypeError) as exc:
            # Unrecoverable: malformed message shape — skip and commit to avoid crash loop.
            logger.error("Poison pill message, skipping session_id=%s: %s", session_id, exc)
            await consumer.commit()
            return

        try:
            ACTIVE_COMPUTE.inc()
            t0 = time.monotonic()
            fv = await feature_computer.compute(session)
            elapsed = time.monotonic() - t0
            COMPUTE_DURATION.observe(elapsed)
            logger.info(
                "Computed features session_id=%s elapsed_ms=%.1f",
                session_id,
                elapsed * 1000,
            )
        except Exception as exc:
            COMPUTE_FAILURES.inc()
            _stats["failed"] += 1
            _runtime["last_error"] = f"{type(exc).__name__}: session_id={session_id}"
            logger.exception("Compute failed session_id=%s", session_id)
            return
        finally:
            ACTIVE_COMPUTE.dec()

        try:
            await emit_feature_vector(fv)
        except Exception as exc:
            PUBLISH_FAILURES.inc()
            _stats["failed"] += 1
            _runtime["last_error"] = f"PublishError: session_id={session_id}"
            logger.error("Publish failed session_id=%s: %s", session_id, exc)
            # Do NOT commit — message will be replayed on restart.
            return

        _runtime["last_published_session_id"] = session_id
        _stats["published"] += 1
        FV_PRODUCED.inc()
        await consumer.commit()

    await run_consumer(_handle_message)


@app.get("/health")
async def health() -> JSONResponse:
    consumer_alive = bool(_consumer_task and not _consumer_task.done())

    kafka_reachable = False
    for host, port in _kafka_targets():
        if await _tcp_check(host, port, timeout=2.0):
            kafka_reachable = True
            break

    status = "ok" if (consumer_alive and kafka_reachable) else "degraded"
    return JSONResponse(
        status_code=200 if status == "ok" else 503,
        content={
            "status": status,
            "service": "feature_svc",
            "kafka_consumer": consumer_alive,
            "kafka_reachable": kafka_reachable,
        },
    )


@app.get("/ready")
async def ready() -> JSONResponse:
    if _consumer_task and not _consumer_task.done():
        return JSONResponse(status_code=200, content={"ready": True})
    return JSONResponse(
        status_code=503,
        content={"ready": False, "reason": "consumer not running"},
    )


@app.get("/viewer")
async def viewer() -> FileResponse:
    return FileResponse(Path(__file__).with_name("viewer.html"))


@app.get("/viewer/status")
async def viewer_status() -> dict[str, object]:
    kafka_checks = []
    for host, port in _kafka_targets():
        kafka_checks.append(
            {"host": host, "port": port, "reachable": await _tcp_check(host, port)}
        )

    db_target = _db_target()
    db_check: dict[str, object]
    if db_target is None:
        db_check = {"configured": False, "reachable": None}
    else:
        db_check = {
            "configured": True,
            "host": db_target[0],
            "port": db_target[1],
            "reachable": await _tcp_check(db_target[0], db_target[1]),
        }

    return {
        "service": "feature_svc",
        "kafka_bootstrap": KAFKA_BOOTSTRAP,
        "feature_version": FEATURE_VERSION,
        "feature_variant": FEATURE_VARIANT,
        "required_env_status": _required_env_status(),
        "consumer_task_running": bool(_consumer_task and not _consumer_task.done()),
        "consumer_task_done": bool(_consumer_task and _consumer_task.done()),
        "consumer_task_cancelled": bool(_consumer_task and _consumer_task.cancelled()),
        "stats": _stats,
        "runtime": _runtime,
        "connections": {
            "kafka": kafka_checks,
            "graph_db": db_check,
        },
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT, loop="uvloop")
