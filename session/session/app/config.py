"""Environment-backed settings for the session service."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from uuid import UUID


# Always load service-local .env first so uvicorn/celery pick host values.
ENV_FILE = Path(__file__).resolve().parents[1] / ".env"
load_dotenv(ENV_FILE)

# Observer payloads omit tenant_id; use this UUID for single-tenant dev.
_DEFAULT_TENANT_RAW = os.getenv(
    "SESSION_DEFAULT_TENANT_ID",
    "00000000-0000-0000-0000-000000000001",
)
try:
    DEFAULT_TENANT_ID = UUID(_DEFAULT_TENANT_RAW)
except ValueError:
    DEFAULT_TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")

# If set, ``POST /ingest/raw-event`` requires matching ``X-API-Key`` header.
INGEST_API_KEY = os.getenv("SESSION_INGEST_API_KEY", "").strip()

# Same broker as Observer: it sets ``KAFKA_BOOTSTRAP_SERVERS``; Session accepts both names.
KAFKA_BOOTSTRAP = (
    os.getenv("KAFKA_BOOTSTRAP", "").strip()
    or os.getenv("KAFKA_BOOTSTRAP_SERVERS", "").strip()
    or "kafka:9092"
)
RAW_EVENTS_TOPIC = os.getenv("RAW_EVENTS_TOPIC", "raw_events")
SESSION_ENRICHED_TOPIC = os.getenv("SESSION_ENRICHED_TOPIC", "session_enriched")
SESSION_CONSUMER_GROUP = os.getenv("SESSION_CONSUMER_GROUP", "session-svc-group")

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)

PG_DSN = os.getenv("PG_DSN", "postgresql://user:pass@postgres:5432/cartdb")

SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", os.getenv("HEARTBEAT_TIMEOUT", "1800")))
HEARTBEAT_TIMEOUT = SESSION_TTL_SECONDS
BOT_THRESHOLD = float(os.getenv("BOT_THRESHOLD", "0.7"))
SESSION_WINDOWS = tuple(
    int(x) for x in os.getenv("SESSION_WINDOWS", "30,60,90").split(",")
)

REDIS_MEMORY_LIMIT_BYTES = int(os.getenv("REDIS_MEMORY_LIMIT_BYTES", str(512 * 1024 * 1024)))
BACKPRESSURE_SLEEP_SEC = float(os.getenv("BACKPRESSURE_SLEEP_SEC", "0.5"))

# kafka | http | both — use one path from Observer unless you intend duplicate delivery.
_raw_src = os.getenv("SESSION_EVENT_SOURCE", "both").strip().lower()
SESSION_EVENT_SOURCE = _raw_src if _raw_src in ("kafka", "http", "both") else "both"

# When true and Observer ``event_id`` is present, second delivery (e.g. Kafka + HTTP) is skipped.
SESSION_DEDUPE_EVENT_ID = os.getenv("SESSION_DEDUPE_EVENT_ID", "true").strip().lower() in (
    "1",
    "true",
    "yes",
)
