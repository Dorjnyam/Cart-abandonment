from __future__ import annotations

from prometheus_client import Counter, Gauge, Histogram, make_asgi_app

# ── Counters ──────────────────────────────────────────────────────────────────
messages_consumed = Counter(
    "session_messages_consumed_total",
    "Kafka raw_events messages consumed",
)
sessions_created = Counter(
    "session_sessions_created_total",
    "New sessions created in Redis",
)
sessions_finalized = Counter(
    "session_sessions_finalized_total",
    "Sessions flushed to PostgreSQL and Kafka",
)
kafka_emit_failures = Counter(
    "session_kafka_emit_failures_total",
    "Failures emitting to session_enriched topic",
)
db_write_errors = Counter(
    "session_db_write_errors_total",
    "PostgreSQL write errors in write_session_to_pg",
)
poison_pills = Counter(
    "session_poison_pills_total",
    "Malformed Kafka messages skipped (committed without processing)",
)

# ── Gauges ────────────────────────────────────────────────────────────────────
active_sessions = Gauge(
    "session_active_sessions_count",
    "Sessions currently alive in Redis (approximate)",
)

# ── Histograms ────────────────────────────────────────────────────────────────
session_duration_histogram = Histogram(
    "session_duration_seconds",
    "Session duration in seconds at finalization",
    buckets=[30, 60, 120, 300, 600, 1800, 3600],
)
processing_latency = Histogram(
    "session_message_processing_latency_seconds",
    "Time from message consumed to offset committed",
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5],
)


def metrics_app():
    """Return a Prometheus ASGI app suitable for app.mount('/metrics', ...)."""
    return make_asgi_app()
