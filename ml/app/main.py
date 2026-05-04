import asyncio
import concurrent.futures
import logging
import os
import signal
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from prometheus_client import make_asgi_app
from pythonjsonlogger import jsonlogger

from app.config import settings
from app.consumer import get_consumer_task, start_consumer, stop_consumer
from app.db import close_pool, init_pool
from app.metrics import model_version_info
from app.pipeline import pipeline
from app.producer import get_producer, start_producer, stop_producer

handler = logging.StreamHandler()
handler.setFormatter(jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)

logger = logging.getLogger(__name__)
_started_at: datetime | None = None
_recent_events: list[str] = []
_MAX_EVENTS = 40
_consumer_failed = False


def _push_event(message: str) -> None:
    """Keep a small in-memory ring buffer of recent lifecycle events for the viewer."""
    global _recent_events
    ts = datetime.now(timezone.utc).isoformat(timespec="seconds")
    line = f"{ts} · {message}"
    _recent_events.append(line)
    if len(_recent_events) > _MAX_EVENTS:
        _recent_events = _recent_events[-_MAX_EVENTS:]


@asynccontextmanager
async def lifespan(_: FastAPI):
    global _started_at

    # Configure a bounded thread pool for CPU-bound inference work.
    loop = asyncio.get_running_loop()
    executor = concurrent.futures.ThreadPoolExecutor(
        max_workers=settings.inference_thread_workers,
        thread_name_prefix="inference",
    )
    loop.set_default_executor(executor)

    _started_at = datetime.now(timezone.utc)
    logger.info("ML Service starting up")
    _push_event("startup: loading models")
    await asyncio.to_thread(pipeline.load_models)
    model_version_info.labels(version=pipeline.xgb.model_version).set(1)
    _push_event(f"startup: models loaded (version={pipeline.xgb.model_version})")
    await init_pool()
    _push_event("startup: PostgreSQL pool ready")
    await start_producer()
    _push_event("startup: Kafka producer started")
    await start_consumer()
    consumer_task = get_consumer_task()
    if consumer_task is not None:
        consumer_task.add_done_callback(_consumer_task_done_callback)
    _push_event("startup: Kafka consumer started; service ready")
    logger.info("ML Service ready — model=%s shap=%s", pipeline.xgb.model_version, settings.shap_enabled)

    yield

    _push_event("shutdown: stopping Kafka consumer")
    await stop_consumer()
    _push_event("shutdown: stopping Kafka producer")
    await stop_producer()
    _push_event("shutdown: closing PostgreSQL pool")
    await close_pool()
    pipeline.unload_models()
    executor.shutdown(wait=True)
    _push_event("shutdown: complete")
    logger.info("ML Service shut down")


def _consumer_task_done_callback(task) -> None:
    global _consumer_failed
    if task.cancelled():
        return
    exc = task.exception()
    if exc is not None:
        _consumer_failed = True
        logger.exception("Kafka consumer task crashed", exc_info=exc)
        _push_event(f"consumer task crashed: {exc}")
        # SIGTERM triggers the lifespan shutdown path cleanly;
        # raise SystemExit inside a done-callback is swallowed by asyncio.
        os.kill(os.getpid(), signal.SIGTERM)


app = FastAPI(title="ML Prediction Service", lifespan=lifespan)

# Expose Prometheus metrics at /metrics
app.mount("/metrics", make_asgi_app())


async def _check_producer() -> bool:
    try:
        return get_producer() is not None
    except Exception:
        return False


@app.get("/health")
async def health() -> JSONResponse:
    consumer_task = get_consumer_task()
    consumer_running = consumer_task is not None and not consumer_task.done()
    model_loaded = pipeline.model_loaded
    producer_ok = await _check_producer()
    ready = model_loaded and consumer_running and not _consumer_failed and producer_ok
    return JSONResponse(
        status_code=200 if ready else 503,
        content={
            "status": "ok" if ready else "degraded",
            "model_loaded": model_loaded,
            "consumer_running": consumer_running,
            "consumer_failed": _consumer_failed,
            "producer_ok": producer_ok,
            "model_version": pipeline.xgb.model_version,
            "feature_count": len(pipeline.xgb.feature_names),
        },
    )


@app.post("/predict")
async def predict_single(body: dict) -> dict:
    from app.schemas import FeatureVector
    fv = FeatureVector(**body)
    _, v2_result = await pipeline.predict(fv)
    return v2_result.model_dump()


@app.get("/model/info")
async def model_info() -> dict:
    return {
        "model_version": pipeline.xgb.model_version,
        "model_variant": settings.model_variant,
        "feature_count": len(pipeline.xgb.feature_names),
        "feature_names": pipeline.xgb.feature_names,
        "model_loaded": pipeline.model_loaded,
        "lstm_loaded": pipeline.lstm_loaded,
        "threshold": settings.abandon_threshold,
        "shap_enabled": settings.shap_enabled,
        "ensemble_weights": {
            "xgboost": settings.ensemble_weight_xgboost,
            "lstm": settings.ensemble_weight_lstm,
        },
    }


@app.post("/model/reload")
async def reload_model() -> dict:
    try:
        await asyncio.to_thread(pipeline.load_models)
        model_version_info.labels(version=pipeline.xgb.model_version).set(1)
        return {"status": "reloaded", "model_version": pipeline.xgb.model_version}
    except Exception as exc:
        raise HTTPException(500, detail=str(exc))


@app.get("/viewer", response_class=HTMLResponse)
async def viewer() -> HTMLResponse:
    base_dir = os.path.dirname(os.path.dirname(__file__))
    viewer_path = os.path.join(base_dir, "viewer.html")
    try:
        with open(viewer_path, "r", encoding="utf-8") as f:
            content = f.read()
    except OSError:
        fallback = (
            "<html><body style='font-family:system-ui;padding:24px'>"
            "<h1>Viewer not available</h1>"
            "<p>viewer.html not found.</p></body></html>"
        )
        return HTMLResponse(content=fallback, status_code=500)
    return HTMLResponse(content=content)


@app.get("/internal/status", response_class=JSONResponse)
async def internal_status() -> JSONResponse:
    from app import consumer as consumer_mod
    from app import db as db_mod
    from app import producer as producer_mod

    now = datetime.now(timezone.utc)
    if _started_at is not None:
        delta = now - _started_at
        seconds = int(delta.total_seconds())
        hours, rem = divmod(seconds, 3600)
        minutes, secs = divmod(rem, 60)
        uptime_str = f"{hours}h {minutes}m {secs}s"
    else:
        uptime_str = "not started"

    model_loaded = pipeline.model_loaded
    pool_ok = getattr(db_mod, "_pool", None) is not None
    producer_ok = getattr(producer_mod, "_producer", None) is not None
    consumer_obj = getattr(consumer_mod, "_consumer", None)
    consumer_task = getattr(consumer_mod, "_consumer_task", None)
    consumer_ok = (
        consumer_obj is not None
        and consumer_task is not None
        and not consumer_task.done()
        and not _consumer_failed
    )

    def status_entry(ok: bool, label_ok: str, label_bad: str, details: str) -> dict[str, str]:
        return {
            "status": "ok" if ok else "bad",
            "label": label_ok if ok else label_bad,
            "details": details,
        }

    data: dict[str, object] = {
        "status": "ok" if model_loaded and pool_ok and producer_ok and consumer_ok else "warn",
        "overall_status": "ok" if model_loaded and pool_ok and producer_ok and consumer_ok else "warn",
        "model_version": pipeline.xgb.model_version,
        "model_variant": settings.model_variant,
        "feature_count": len(pipeline.xgb.feature_names),
        "shap_enabled": settings.shap_enabled,
        "uptime": uptime_str,
        "environment": os.getenv("ENVIRONMENT", "local"),
        "postgres": status_entry(
            pool_ok,
            "Pool ready",
            "Pool not initialized",
            f"dsn: {settings.pg_dsn[:30]}...",  # truncate to avoid leaking password in UI
        ),
        "kafka": status_entry(
            True,
            "Configured",
            "Configuration missing",
            f"bootstrap: {settings.kafka_bootstrap_servers}; "
            f"in={settings.kafka_input_topic}; out={settings.kafka_output_topic}; "
            f"out_v2={settings.kafka_output_topic_v2}; dlq={settings.kafka_dlq_topic}",
        ),
        "minio": status_entry(
            True,
            "File-based model loading" if not settings.minio_endpoint else "MinIO configured",
            "Not configured",
            f"endpoint: {settings.minio_endpoint or 'local filesystem'}; "
            f"variant: {settings.model_variant}",
        ),
        "consumer": {
            "status": "ok" if consumer_ok else "bad",
            "label": "Running" if consumer_ok else "Not running",
        },
        "producer": {
            "status": "ok" if producer_ok else "bad",
            "label": "Running" if producer_ok else "Not running",
        },
        "pool": {
            "status": "ok" if pool_ok else "bad",
            "label": "Initialized" if pool_ok else "Not initialized",
        },
        "model": {
            "status": "ok" if model_loaded else "bad",
            "label": "Loaded" if model_loaded else "Not loaded",
        },
        "worker": os.getenv("HOSTNAME", os.getenv("COMPUTERNAME", "")),
        "timezone": os.getenv("TZ", "UTC"),
        "recent_events": list(_recent_events),
    }

    return JSONResponse(content=data)
