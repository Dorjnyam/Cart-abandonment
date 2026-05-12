import logging
import pickle
from pathlib import Path
from typing import Any

import joblib
import numpy as np

try:
    import shap
except ModuleNotFoundError:  # pragma: no cover - exercised in minimal local envs
    shap = None

try:
    import xgboost as xgb
except ModuleNotFoundError:  # pragma: no cover - exercised in minimal local envs
    xgb = None

from app.config import CATEGORICAL_ENCODINGS, settings

logger = logging.getLogger(__name__)


class XGBoostModel:
    def __init__(self) -> None:
        self.model: Any | None = None
        self.explainer: Any | None = None
        self.feature_names: list[str] = []
        self.model_version: str = settings.model_version_xgboost
        self.threshold: float = settings.abandon_threshold
        self.model_loaded: bool = False

    def load(self, model_path: str | None = None) -> None:
        # Model artifact дотор feature_order байх ёстой.
        # Энэ order нь сургалтын dataset-ийн column order-той таарахгүй бол inference буруу болно.
        if xgb is None:
            raise RuntimeError("xgboost is not installed; install ml/requirements.txt before loading the model")
        path = Path(model_path or settings.model_path_xgboost)
        try:
            try:
                model_obj = joblib.load(path)
            except Exception:
                with path.open("rb") as f:
                    model_obj = pickle.load(f)

            if isinstance(model_obj, dict):
                feature_names = model_obj.get("feature_order") or model_obj.get("feature_names")
                self.threshold = float(model_obj.get("threshold", settings.abandon_threshold))
                self.model_version = str(model_obj.get("model_version", settings.model_version_xgboost))
                model_obj = model_obj.get("model")
            else:
                feature_names = None

            if not isinstance(model_obj, xgb.XGBClassifier):
                raise TypeError("Model file must contain a pickled xgb.XGBClassifier")

            self.model = model_obj
            self.feature_names = list(feature_names or getattr(self.model, "feature_names_in_", []))
            if not self.feature_names:
                raise ValueError("Model artifact does not contain feature order")
            self.explainer = shap.TreeExplainer(self.model) if shap is not None else None
            self.model_loaded = True
            logger.info(
                "XGBoost model loaded from %s — %d features: %s",
                path,
                len(self.feature_names),
                self.feature_names,
            )
        except FileNotFoundError:
            # Hard-fail: starting without a model would silently produce wrong predictions.
            raise RuntimeError(
                f"XGBoost model file not found: {path}. "
                "Ensure the model exists locally or configure MINIO_ENDPOINT for auto-download."
            )
        except Exception as exc:
            raise RuntimeError(f"XGBoost model load failed: {exc}") from exc

    def unload(self) -> None:
        self.model = None
        self.explainer = None
        self.feature_names = []
        self.threshold = settings.abandon_threshold
        self.model_loaded = False

    def _feature_array(self, features: dict[str, Any]) -> np.ndarray:
        # Payload-д дутсан feature-г 0.0 болгож нөхнө. Энэ нь partial feature_ready message дээр crash хийхгүй.
        # Гэхдээ model feature_order-ийг өөрчлөхгүй, зөвхөн trained order-р numpy row үүсгэнэ.
        encoded: dict[str, Any] = dict(features)
        for field, val in encoded.items():
            if isinstance(val, bool):
                encoded[field] = float(val)
            elif isinstance(val, str):
                enc = CATEGORICAL_ENCODINGS.get(field, {})
                encoded[field] = float(enc.get(val, hash(val) % 100))

        missing = [n for n in self.feature_names if n not in encoded]
        if missing:
            logger.warning(
                "Feature mismatch: %d model features absent from payload (filled 0.0): %s",
                len(missing),
                missing[:10],
            )

        row = [encoded.get(name, 0.0) for name in self.feature_names]
        X = np.array([row], dtype=np.float32)
        return np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)

    def predict_with_shap(self, features: dict[str, Any]) -> tuple[float, dict[str, float]]:
        if self.model is None:
            raise RuntimeError("XGBoost model is not loaded")

        X = self._feature_array(features)
        score = float(self.model.predict_proba(X)[0][1])

        shap_dict: dict[str, float] = {}
        if self.explainer is not None and settings.shap_enabled:
            try:
                shap_values: Any = self.explainer.shap_values(X)
                if isinstance(shap_values, list):
                    shap_row = shap_values[1][0] if len(shap_values) > 1 else shap_values[0][0]
                else:
                    shap_row = shap_values[0]
                shap_dict = {name: float(v) for name, v in zip(self.feature_names, shap_row)}
            except Exception as exc:
                logger.warning("SHAP computation failed, skipping: %s", exc)

        if shap_dict:
            # top_features нь explanatory support; causal proof гэж overclaim хийхгүй.
            top_n = settings.shap_top_n
            shap_dict = dict(
                sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:top_n]
            )

        return score, shap_dict
