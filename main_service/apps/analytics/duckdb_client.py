import concurrent.futures
import logging
from contextlib import contextmanager
from datetime import date, timedelta
from typing import Any, Iterable, List, Tuple

import duckdb
import redis
from django.conf import settings

logger = logging.getLogger(__name__)

_read_pool = concurrent.futures.ThreadPoolExecutor(max_workers=4)


@contextmanager
def writer_connection() -> Iterable[duckdb.DuckDBPyConnection]:
    """
    Single-writer connection for Celery tasks.

    DuckDB only supports one writer. Celery normally uses multiple worker
    processes, so this must be a distributed lock rather than a process-local
    threading.Lock.
    """

    redis_client = redis.Redis.from_url(settings.REDIS_URL)
    lock = redis_client.lock("duckdb:write_lock", timeout=120, blocking_timeout=30)
    acquired = lock.acquire()
    if not acquired:
        raise RuntimeError("Could not acquire DuckDB write lock within 30 seconds")

    con = duckdb.connect(settings.DUCKDB_PATH)
    try:
        yield con
        con.commit()
    finally:
        con.close()
        try:
            lock.release()
        except redis.exceptions.LockError:
            logger.warning("DuckDB write lock expired before release")


def migrate_existing_schema(con: duckdb.DuckDBPyConnection) -> None:
    """Add new columns to existing DuckDB files that have the old schema."""
    alter_statements = [
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS visitor_id VARCHAR",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS model_variant VARCHAR DEFAULT 'baseline'",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS abandonment_probability FLOAT",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS confidence FLOAT",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS model_version VARCHAR",
        "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS predicted_at TIMESTAMP",
    ]
    for stmt in alter_statements:
        try:
            con.execute(stmt)
        except Exception:
            pass  # Column already exists or table not yet created


def ensure_analytics_schema(con: duckdb.DuckDBPyConnection) -> None:
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS predictions (
            id           INTEGER PRIMARY KEY,
            tenant_id    INTEGER NOT NULL,
            session_id   VARCHAR NOT NULL,
            visitor_id   VARCHAR,
            model_variant        VARCHAR DEFAULT 'baseline',
            predicted_class      VARCHAR,
            prediction_score     FLOAT,
            abandonment_probability FLOAT,
            confidence           FLOAT,
            shap_values          JSON,
            model_version        VARCHAR,
            predicted_at         TIMESTAMP,
            created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    con.execute(
        "CREATE INDEX IF NOT EXISTS idx_predictions_variant ON predictions(model_variant)"
    )
    con.execute(
        "CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(predicted_at)"
    )
    con.execute(
        "CREATE INDEX IF NOT EXISTS idx_predictions_variant_date ON predictions(model_variant, predicted_at)"
    )
    con.execute(
        """
        CREATE TABLE IF NOT EXISTS sessions_summary (
            tenant_id INTEGER,
            session_id TEXT,
            predicted_class TEXT,
            prediction_score DOUBLE,
            created_at TIMESTAMP
        )
        """
    )
    migrate_existing_schema(con)


def _run_read_query(sql: str, params: Tuple[Any, ...] | None = None) -> List[tuple]:
    con = duckdb.connect(settings.DUCKDB_PATH, read_only=True)
    try:
        cur = con.execute(sql, params or ())
        return cur.fetchall()
    finally:
        con.close()


def run_read_query(sql: str, params: Tuple[Any, ...] | None = None) -> List[tuple]:
    """Submit a read-only query to the thread pool so we don't block Django request threads."""
    future = _read_pool.submit(_run_read_query, sql, params or ())
    return future.result()


def get_duckdb_daily_trend(tenant_id: int | str, days: int = 7) -> list[dict]:
    """
    Return daily abandoned/converted counts for the last `days` days from DuckDB.
    Falls back to an empty list if DuckDB is unavailable or has no data yet.
    """
    cutoff = date.today() - timedelta(days=days - 1)
    try:
        rows = run_read_query(
            """
            SELECT
                CAST(predicted_at AS DATE)                                          AS day,
                COUNT(*) FILTER (WHERE predicted_class IN ('abandoned','abandon'))  AS abandoned,
                COUNT(*) FILTER (WHERE predicted_class = 'converted')               AS converted
            FROM   predictions
            WHERE  tenant_id = ?
              AND  predicted_at >= ?
            GROUP  BY 1
            ORDER  BY 1 DESC
            """,
            (int(tenant_id), cutoff),
        )
        return [{"date": str(r[0]), "abandoned": r[1], "converted": r[2]} for r in rows]
    except Exception as exc:
        logger.warning("get_duckdb_daily_trend failed: %s", exc)
        return []
