import asyncio
import json
import logging

import asyncpg

from app.config import settings
from app.schemas import PredictionOut

logger = logging.getLogger(__name__)

_pool: asyncpg.Pool | None = None


async def init_pool() -> None:
    global _pool
    max_retries = 10
    for attempt in range(max_retries):
        try:
            _pool = await asyncpg.create_pool(settings.pg_dsn_asyncpg, min_size=2, max_size=10)
            await _create_schema()
            logger.info("PostgreSQL pool ready")
            return
        except Exception as exc:
            if attempt < max_retries - 1:
                wait = min(2 ** attempt, 30)
                logger.warning(
                    "PostgreSQL not ready (attempt %d/%d), retrying in %ds: %s",
                    attempt + 1, max_retries, wait, exc,
                )
                await asyncio.sleep(wait)
            else:
                raise


async def _create_schema() -> None:
    if _pool is None:
        raise RuntimeError("PostgreSQL pool is not initialized")

    async with _pool.acquire() as conn:
        await conn.execute(
            """
            CREATE SCHEMA IF NOT EXISTS predictions;

            CREATE TABLE IF NOT EXISTS predictions.predictions (
                prediction_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id             UUID NOT NULL,
                tenant_id              UUID NOT NULL,
                predicted_at           TIMESTAMPTZ NOT NULL,
                window_seconds         INTEGER,
                abandon_probability    FLOAT NOT NULL,
                diagnosis_category     VARCHAR(30) NOT NULL,
                shap_values            JSONB NOT NULL,
                model_version          VARCHAR(50) NOT NULL,
                feature_vector_version VARCHAR(50)
            );

            CREATE INDEX IF NOT EXISTS idx_pred_session
                ON predictions.predictions (session_id);
            CREATE INDEX IF NOT EXISTS idx_pred_tenant_date
                ON predictions.predictions (tenant_id, predicted_at DESC);
            """
        )


async def write_prediction(prediction: PredictionOut, feature_version: str = "") -> None:
    if _pool is None:
        raise RuntimeError("PostgreSQL pool is not initialized")

    async with _pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO predictions.predictions
                (session_id, tenant_id, predicted_at, window_seconds,
                 abandon_probability, diagnosis_category, shap_values,
                 model_version, feature_vector_version)
            VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
            """,
            prediction.session_id,
            prediction.tenant_id,
            prediction.predicted_at,
            prediction.window_seconds,
            prediction.abandon_probability,
            prediction.diagnosis_category,
            json.dumps(prediction.shap_values),
            prediction.model_version,
            feature_version,
        )


async def close_pool() -> None:
    if _pool is not None:
        await _pool.close()
