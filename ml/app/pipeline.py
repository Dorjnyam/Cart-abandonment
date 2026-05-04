import asyncio
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

from app.config import settings
from app.lstm_model import LSTMModel
from app.schemas import FeatureVector, PredictedClass, PredictionOut, PredictionResult
from app.xgboost_model import XGBoostModel

logger = logging.getLogger(__name__)


def _maybe_download_models() -> None:
    """Download model files from MinIO when MINIO_ENDPOINT is configured."""
    if not settings.minio_endpoint:
        return
    from minio import Minio

    client = Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )
    variant_paths = {
        "baseline": settings.model_path_xgboost_baseline,
        "extended": settings.model_path_xgboost_extended,
        "full": settings.model_path_xgboost_full,
    }
    to_download = [
        variant_paths.get(settings.model_variant, settings.model_path_xgboost_full),
        settings.model_path_lstm,
    ]
    for local_path in to_download:
        p = Path(local_path)
        if not p.exists():
            p.parent.mkdir(parents=True, exist_ok=True)
            client.fget_object(settings.minio_bucket, p.name, str(p))
            logger.info("Downloaded %s from MinIO bucket %s", p.name, settings.minio_bucket)


class PredictionPipeline:
    def __init__(self) -> None:
        self.xgb = XGBoostModel()
        self.lstm = LSTMModel()
        self._lstm_loaded = False
        self._xgb_lock = Lock()
        self._semaphore = asyncio.Semaphore(settings.max_concurrent_inferences)

    def load_models(self) -> None:
        _maybe_download_models()
        variant = settings.model_variant
        path_map = {
            "baseline": settings.model_path_xgboost_baseline,
            "extended": settings.model_path_xgboost_extended,
            "full":     settings.model_path_xgboost_full,
        }
        model_path = path_map.get(variant, settings.model_path_xgboost_full)
        logger.info("Loading XGBoost variant=%s from %s", variant, model_path)
        self.xgb.load(model_path)
        self.xgb.model_version = settings.model_version_xgboost
        try:
            self.lstm.load()
            self.lstm.model_version = settings.model_version_lstm
            self._lstm_loaded = True
        except Exception as exc:
            # LSTM is optional; fall back to XGBoost-only predictions.
            logger.warning("LSTM not loaded (%s); running XGBoost-only", exc)
            self._lstm_loaded = False

    def unload_models(self) -> None:
        self.xgb.unload()
        self.lstm.unload()
        self._lstm_loaded = False

    @property
    def model_loaded(self) -> bool:
        return self.xgb.model_loaded

    @property
    def lstm_loaded(self) -> bool:
        return self._lstm_loaded

    def _thread_safe_predict(self, features: dict) -> tuple[float, dict]:
        with self._xgb_lock:
            return self.xgb.predict_with_shap(features)

    async def _run_xgb(self, features: dict) -> tuple[float, dict]:
        from app.metrics import inference_duration, inference_failures
        t = time.perf_counter()
        try:
            result = await asyncio.to_thread(self._thread_safe_predict, features)
            inference_duration.labels(model="xgb").observe(time.perf_counter() - t)
            return result
        except Exception:
            inference_failures.labels(model="xgb").inc()
            raise

    async def _run_lstm(self, event_sequence: list[float]) -> float | None:
        from app.metrics import inference_duration, inference_failures
        if not self._lstm_loaded:
            return None
        t = time.perf_counter()
        try:
            result = await asyncio.to_thread(self.lstm.predict_score, event_sequence)
            inference_duration.labels(model="lstm").observe(time.perf_counter() - t)
            return result
        except Exception as exc:
            inference_failures.labels(model="lstm").inc()
            logger.warning("LSTM inference failed, falling back to XGBoost-only: %s", exc)
            return None

    async def predict(self, fv: FeatureVector) -> tuple[PredictionOut, PredictionResult]:
        from app.metrics import abandonment_probability, inference_duration

        async with self._semaphore:
            t_total = time.perf_counter()
            (xgb_score, shap_values), lstm_score = await asyncio.gather(
                self._run_xgb(fv.features),
                self._run_lstm(fv.event_sequence),
            )
            inference_duration.labels(model="total").observe(time.perf_counter() - t_total)

        if lstm_score is None:
            final_score = xgb_score
            model_version = self.xgb.model_version
            ensemble_method = "xgb_only"
        else:
            final_score = (
                settings.ensemble_weight_xgboost * xgb_score
                + settings.ensemble_weight_lstm * lstm_score
            )
            model_version = f"{self.xgb.model_version}+{self.lstm.model_version}"
            ensemble_method = "weighted_avg"

        final_score = max(0.0, min(1.0, final_score))
        abandonment_probability.observe(final_score)

        predicted_class = (
            PredictedClass.abandoned
            if final_score >= settings.abandon_threshold
            else PredictedClass.converted
        )
        predicted_at = datetime.now(timezone.utc)

        legacy_out = PredictionOut(
            session_id=fv.session_id,
            tenant_id=fv.tenant_id,
            window_seconds=fv.window_seconds,
            abandon_probability=final_score,
            diagnosis_category=predicted_class.value,
            shap_values=shap_values,
            model_version=model_version,
            predicted_at=predicted_at,
        )

        v2_result = PredictionResult(
            session_id=fv.session_id,
            visitor_id=fv.visitor_id,
            prediction_score=final_score,
            predicted_class=predicted_class,
            shap_values=shap_values,
            model_version=model_version,
            timestamp=predicted_at,
            xgb_score=xgb_score,
            lstm_score=lstm_score,
            ensemble_method=ensemble_method,
        )
        return legacy_out, v2_result


pipeline = PredictionPipeline()
