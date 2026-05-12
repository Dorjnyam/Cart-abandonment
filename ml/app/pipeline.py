import asyncio
import logging
import time
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock

from app.config import settings
from app.schemas import FeatureVector, PredictedClass, PredictionOut, PredictionResult, TopFeature
from app.xgboost_model import XGBoostModel

logger = logging.getLogger(__name__)


def _maybe_download_models() -> None:
    """MinIO тохиргоотой үед active XGBoost model artifact-г татна."""

    if not settings.minio_endpoint:
        return
    from minio import Minio

    client = Minio(
        settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_secure,
    )
    path = Path(settings.model_path_xgboost)
    if not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        client.fget_object(settings.minio_bucket, path.name, str(path))
        logger.info("Downloaded %s from MinIO bucket %s", path.name, settings.minio_bucket)


class PredictionPipeline:
    def __init__(self) -> None:
        # Thesis MVP active inference нь зөвхөн XGBoost. LSTM нь future work тул pipeline-д ачаалахгүй.
        self.xgb = XGBoostModel()
        self._xgb_lock = Lock()
        self._semaphore = asyncio.Semaphore(settings.max_concurrent_inferences)

    def load_models(self) -> None:
        _maybe_download_models()
        logger.info("Loading XGBoost model from %s", settings.model_path_xgboost)
        self.xgb.load(settings.model_path_xgboost)

    def unload_models(self) -> None:
        self.xgb.unload()

    @property
    def model_loaded(self) -> bool:
        return self.xgb.model_loaded

    @property
    def lstm_loaded(self) -> bool:
        return False

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

    async def predict(self, fv: FeatureVector) -> tuple[PredictionOut, PredictionResult]:
        from app.metrics import abandonment_probability, inference_duration

        async with self._semaphore:
            t_total = time.perf_counter()
            xgb_score, shap_values = await self._run_xgb(fv.features)
            inference_duration.labels(model="total").observe(time.perf_counter() - t_total)

        # XGBoost score-г 0..1 хооронд clamp хийж dashboard/API contract-г тогтвортой байлгана.
        final_score = max(0.0, min(1.0, xgb_score))
        abandonment_probability.observe(final_score)
        threshold = self.xgb.threshold

        # threshold-оос дээш бол abandoned, доош бол converted гэж ML predicted_label гаргана.
        # Business truth override-г Main service хийдэг; ML service өөрөө purchase_success-г override хийхгүй.
        predicted_class = (
            PredictedClass.abandoned
            if final_score >= threshold
            else PredictedClass.converted
        )
        predicted_label = 1 if predicted_class == PredictedClass.abandoned else 0
        predicted_at = datetime.now(timezone.utc)
        top_features = [
            TopFeature(
                feature=name,
                value=float(fv.features.get(name, 0.0) or 0.0),
                importance=float(importance),
            )
            for name, importance in shap_values.items()
        ]

        legacy_out = PredictionOut(
            session_id=fv.session_id,
            tenant_id=fv.tenant_id,
            window_seconds=fv.window_seconds,
            abandon_probability=final_score,
            diagnosis_category=predicted_class.value,
            shap_values=shap_values,
            model_version=self.xgb.model_version,
            predicted_at=predicted_at,
        )

        result = PredictionResult(
            session_id=fv.session_id,
            tenant_id=fv.tenant_id,
            organization_id=fv.tenant_id,
            visitor_id=fv.visitor_id,
            abandonment_probability=final_score,
            predicted_label=predicted_label,
            predicted_class=predicted_class,
            model_name="xgboost",
            model_version=self.xgb.model_version,
            threshold=threshold,
            top_features=top_features,
            features=fv.features,
            created_at=predicted_at,
            prediction_score=final_score,
            shap_values=shap_values,
            xgb_score=final_score,
            lstm_score=None,
            ensemble_method="xgb_only",
            session_state=fv.session_state,
            has_purchase_success=fv.has_purchase_success,
            has_checkout_start=fv.has_checkout_start,
            has_cart_activity=fv.has_cart_activity,
            final_event_type=fv.final_event_type,
            event_sequence=fv.event_sequence,
        )
        return legacy_out, result


pipeline = PredictionPipeline()
