import asyncio
import concurrent.futures
import json
import logging
import os
import signal
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

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
from app.runtime_state import record_event, snapshot as runtime_snapshot

handler = logging.StreamHandler()
handler.setFormatter(jsonlogger.JsonFormatter("%(asctime)s %(levelname)s %(name)s %(message)s"))
logging.getLogger().addHandler(handler)
logging.getLogger().setLevel(logging.INFO)

logger = logging.getLogger(__name__)
_started_at: datetime | None = None
_consumer_failed = False


def _push_event(message: str) -> None:
    record_event(message)
    return


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


def _resolve_model_path(path_value: str) -> Path:
    path = Path(path_value)
    if path.is_absolute():
        return path
    return Path.cwd() / path


def _read_json(path: Path) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None
    except json.JSONDecodeError as exc:
        return {"error": f"invalid json: {exc}"}
    except OSError as exc:
        return {"error": str(exc)}


def _artifact_info(path: Path) -> dict[str, Any]:
    exists = path.exists()
    info: dict[str, Any] = {
        "path": str(path),
        "exists": exists,
    }
    if exists:
        stat = path.stat()
        info["size_bytes"] = stat.st_size
        info["modified_at"] = datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(
            timespec="seconds"
        )
    return info


def _load_model_artifacts() -> dict[str, Any]:
    model_path = _resolve_model_path(settings.model_path_xgboost)
    model_dir = model_path.parent
    artifact_names = [
        "metrics_xgboost.json",
        "confusion_matrix.json",
        "classification_report.json",
        "dataset_metadata.json",
        "feature_order.json",
        "metrics_baseline.json",
        "metrics_extended.json",
        "metrics_full.json",
    ]
    artifacts = {name: _artifact_info(model_dir / name) for name in artifact_names}
    confusion = _read_json(model_dir / "confusion_matrix.json")
    confusion_summary: dict[str, Any] = {}
    if isinstance(confusion, dict):
        matrix = confusion.get("matrix")
        if (
            isinstance(matrix, list)
            and len(matrix) == 2
            and all(isinstance(row, list) and len(row) == 2 for row in matrix)
        ):
            tn, fp = matrix[0]
            fn, tp = matrix[1]
            total = tn + fp + fn + tp
            confusion_summary = {
                "tn": tn,
                "fp": fp,
                "fn": fn,
                "tp": tp,
                "total": total,
                "accuracy": (tn + tp) / total if total else None,
            }

    return {
        "model_path": _artifact_info(model_path),
        "directory": str(model_dir),
        "artifacts": artifacts,
        "metrics": _read_json(model_dir / "metrics_xgboost.json"),
        "confusion_matrix": confusion,
        "confusion_summary": confusion_summary,
        "classification_report": _read_json(model_dir / "classification_report.json"),
        "dataset_metadata": _read_json(model_dir / "dataset_metadata.json"),
        "feature_order": _read_json(model_dir / "feature_order.json"),
        "variant_metrics": {
            "baseline": _read_json(model_dir / "metrics_baseline.json"),
            "extended": _read_json(model_dir / "metrics_extended.json"),
            "full": _read_json(model_dir / "metrics_full.json"),
        },
    }


def _kafka_targets() -> list[tuple[str, int]]:
    targets: list[tuple[str, int]] = []
    for item in settings.kafka_bootstrap_servers.split(","):
        host_port = item.strip()
        if not host_port or ":" not in host_port:
            continue
        host, port_str = host_port.rsplit(":", 1)
        try:
            targets.append((host, int(port_str)))
        except ValueError:
            continue
    return targets


async def _tcp_check(host: str, port: int, timeout: float = 2.0) -> bool:
    try:
        _, writer = await asyncio.wait_for(asyncio.open_connection(host, port), timeout=timeout)
        writer.close()
        await writer.wait_closed()
        return True
    except Exception:
        return False


async def _postgres_query_ok(pool: Any) -> bool:
    if pool is None:
        return False
    try:
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return True
    except Exception:
        return False


def _pg_details() -> str:
    parsed = urlparse(settings.pg_dsn_asyncpg)
    if parsed.hostname is None:
        return "dsn: configured"
    return f"host: {parsed.hostname}; port: {parsed.port or 5432}; db: {parsed.path.lstrip('/')}"


def _status_entry(ok: bool, label_ok: str, label_bad: str, details: str) -> dict[str, Any]:
    return {
        "status": "ok" if ok else "bad",
        "label": label_ok if ok else label_bad,
        "details": details,
    }


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
        "model_name": "xgboost",
        "model_version": pipeline.xgb.model_version,
        "model_variant": settings.model_variant,
        "feature_count": len(pipeline.xgb.feature_names),
        "feature_names": pipeline.xgb.feature_names,
        "model_loaded": pipeline.model_loaded,
        "lstm_status": "future_work_disabled",
        "threshold": settings.abandon_threshold,
        "shap_enabled": settings.shap_enabled,
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
    pool = getattr(db_mod, "_pool", None)
    pool_initialized = pool is not None
    pool_query_ok = await _postgres_query_ok(pool)
    producer_ok = getattr(producer_mod, "_producer", None) is not None
    consumer_obj = getattr(consumer_mod, "_consumer", None)
    consumer_task = getattr(consumer_mod, "_consumer_task", None)
    consumer_ok = (
        consumer_obj is not None
        and consumer_task is not None
        and not consumer_task.done()
        and not _consumer_failed
    )

    kafka_checks = [
        {
            "host": host,
            "port": port,
            "reachable": await _tcp_check(host, port),
        }
        for host, port in _kafka_targets()
    ]
    kafka_reachable = any(item["reachable"] for item in kafka_checks)
    runtime = runtime_snapshot()
    model_artifacts = _load_model_artifacts()
    stats = runtime["stats"]
    overall_ok = model_loaded and pool_query_ok and producer_ok and consumer_ok and kafka_reachable

    pipeline_flow = [
        {
            "stage": "feature_ready input",
            "status": "ok" if consumer_ok and kafka_reachable else "bad",
            "from": "feature_service",
            "to": "ml_service Kafka consumer",
            "topic": settings.kafka_input_topic,
            "count": stats["messages_consumed"],
        },
        {
            "stage": "feature vector validation",
            "status": "ok" if consumer_ok else "bad",
            "from": "Kafka JSON payload",
            "to": "FeatureVector schema",
            "count": stats["feature_vectors_validated"],
        },
        {
            "stage": "XGBoost inference",
            "status": "ok" if model_loaded else "bad",
            "from": f"{len(pipeline.xgb.feature_names)} model features",
            "to": "abandonment probability + SHAP top features",
            "count": stats["predictions_created"],
        },
        {
            "stage": "PostgreSQL write",
            "status": "ok" if pool_query_ok else "bad",
            "from": "PredictionOut",
            "to": "predictions.predictions",
            "count": stats["predictions_persisted"],
        },
        {
            "stage": "Kafka prediction publish",
            "status": "ok" if producer_ok and kafka_reachable else "bad",
            "from": "PredictionResult",
            "to": f"{settings.kafka_output_topic}, {settings.kafka_output_topic_v2}",
            "count": stats["prediction_messages_published"],
        },
    ]

    data: dict[str, object] = {
        "status": "ok" if overall_ok else "warn",
        "overall_status": "ok" if overall_ok else "warn",
        "model_version": pipeline.xgb.model_version,
        "model_variant": settings.model_variant,
        "feature_count": len(pipeline.xgb.feature_names),
        "shap_enabled": settings.shap_enabled,
        "uptime": uptime_str,
        "environment": os.getenv("ENVIRONMENT", "local"),
        "postgres": _status_entry(
            pool_query_ok,
            "Pool ready",
            "Pool not ready",
            _pg_details(),
        ),
        "kafka": _status_entry(
            kafka_reachable,
            "Reachable",
            "Not reachable",
            f"bootstrap: {settings.kafka_bootstrap_servers}; "
            f"in={settings.kafka_input_topic}; out={settings.kafka_output_topic}; "
            f"out_v2={settings.kafka_output_topic_v2}; dlq={settings.kafka_dlq_topic}",
        ),
        "minio": _status_entry(
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
            "status": "ok" if pool_initialized else "bad",
            "label": "Initialized" if pool_initialized else "Not initialized",
        },
        "model": {
            "status": "ok" if model_loaded else "bad",
            "label": "Loaded" if model_loaded else "Not loaded",
            "name": "xgboost",
            "version": pipeline.xgb.model_version,
            "variant": settings.model_variant,
            "threshold": pipeline.xgb.threshold,
            "feature_count": len(pipeline.xgb.feature_names),
            "feature_names": pipeline.xgb.feature_names,
            "shap_enabled": settings.shap_enabled,
            "lstm_status": "future_work_disabled",
        },
        "connections": {
            "kafka": {
                "status": "ok" if kafka_reachable else "bad",
                "checks": kafka_checks,
                "bootstrap": settings.kafka_bootstrap_servers,
                "input_topic": settings.kafka_input_topic,
                "output_topic": settings.kafka_output_topic,
                "output_topic_v2": settings.kafka_output_topic_v2,
                "dlq_topic": settings.kafka_dlq_topic,
            },
            "postgres": {
                "status": "ok" if pool_query_ok else "bad",
                "pool_initialized": pool_initialized,
                "query_ok": pool_query_ok,
                "details": _pg_details(),
            },
            "producer": {"status": "ok" if producer_ok else "bad"},
            "consumer": {"status": "ok" if consumer_ok else "bad"},
            "model_storage": {
                "status": "ok" if model_artifacts["model_path"]["exists"] else "bad",
                "path": model_artifacts["model_path"]["path"],
            },
        },
        "runtime": runtime,
        "pipeline": pipeline_flow,
        "model_artifacts": model_artifacts,
        "worker": os.getenv("HOSTNAME", os.getenv("COMPUTERNAME", "")),
        "timezone": os.getenv("TZ", "UTC"),
        "recent_events": runtime["recent_events"],
    }

    return JSONResponse(content=data)
