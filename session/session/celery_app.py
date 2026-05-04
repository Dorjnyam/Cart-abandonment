from __future__ import annotations

import os
import sys

from celery import Celery

from app.config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND

celery = Celery(
    "session_svc",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)

# Prefork + billiard on Windows often breaks task execution (ValueError in
# celery.app.trace.fast_trace_task). Default to a single-process pool on win32.
_worker_pool = os.environ.get("CELERY_WORKER_POOL")
if _worker_pool:
    _pool = _worker_pool
elif sys.platform == "win32":
    _pool = "solo"
else:
    _pool = "prefork"

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    worker_pool=_pool,
)

# Import modules that register @celery.task; otherwise the worker shows no tasks and
# rejects messages like ``session.emit_window_snapshot`` as unregistered.
import app.scheduler  # noqa: E402, F401
