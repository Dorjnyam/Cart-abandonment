"""
Train XGBoost on labelled sessions from PostgreSQL.
Trains 3 ablation variants: baseline (9 fields), extended (29 fields), full (all fields).
Saves model .pkl files and metrics JSON for each variant, then uploads to MinIO.

Required environment variables:
  PG_DSN             — PostgreSQL connection string
  MINIO_ACCESS_KEY   — MinIO access key
  MINIO_SECRET_KEY   — MinIO secret key

Optional:
  MINIO_URL          — MinIO endpoint (default: localhost:9000)
  MINIO_SECURE       — "true" to use HTTPS (default: false)
"""

import asyncio
import io
import json
import os
import pickle
from datetime import datetime
from pathlib import Path

import asyncpg
import joblib
import pandas as pd
import xgboost as xgb
from minio import Minio
from sklearn.metrics import (
    classification_report,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split

PG_DSN: str = os.environ["PG_DSN"]
MINIO_URL: str = os.getenv("MINIO_URL", "localhost:9000")

# ── Ablation feature sets ────────────────────────────────────────────────────

BASELINE_FIELDS: list[str] = [
    "session_duration_sec", "page_view_count", "cart_item_count",
    "event_count", "device_type", "is_logged_in",
    "checkout_step_detected", "cart_churn_count", "is_mobile",
]

EXTENDED_FIELDS: list[str] = BASELINE_FIELDS + [
    "rage_click", "max_scroll_pct", "active_time_ms", "mouse_distance",
    "time_on_page_sec", "cart_abandonment_signal", "time_to_first_action_ms",
    "page_load_ms", "payment_method", "product_availability",
    "selected_quantity", "avg_price_in_session", "frustration_index",
    "commitment_depth", "price_hesitation_score", "hedonic_ratio",
    "mongolian_trust_barrier", "dist_product_count", "hour_sin", "hour_cos",
]

_EXTRA_FULL: list[str] = [
    "back_navigation", "js_error", "selected_size", "selected_qty",
    "form_fields_touched", "checkout_step", "copy_count", "tab_hidden_ms",
    "outbound_click", "cart_value", "cart_abandoned_count",
    "end_reason", "customer_type", "language",
    "dow_sin", "dow_cos", "time_to_first_action",
    "js_error_count", "page_dwell_ms", "idle_time_ms",
    "click_count", "scroll_count", "form_submit_count", "add_to_cart_count",
    "remove_from_cart_count", "search_count", "filter_count", "sort_count",
    "wishlist_add_count", "share_count", "review_view_count",
    "coupon_applied", "discount_amount", "shipping_cost",
    "return_visit", "visit_count", "days_since_last_visit",
    "referrer_type", "utm_source", "browser_type", "os_type",
    "screen_width", "screen_height", "viewport_width",
    "connection_type", "timezone_offset",
]

_seen: set[str] = set()
FULL_FIELDS: list[str] = []
for _f in EXTENDED_FIELDS + _EXTRA_FULL:
    if _f not in _seen:
        _seen.add(_f)
        FULL_FIELDS.append(_f)

FEATURE_SETS: dict[str, list[str]] = {
    "baseline": BASELINE_FIELDS,
    "extended": EXTENDED_FIELDS,
    "full": FULL_FIELDS,
}

MODEL_PATHS: dict[str, str] = {
    "baseline": "./models/model_baseline_xgboost.pkl",
    "extended": "./models/model_extended_xgboost.pkl",
    "full":     "./models/model_full_xgboost.pkl",
}

# ── Data loading ─────────────────────────────────────────────────────────────


async def load_data() -> list[asyncpg.Record]:
    conn = await asyncpg.connect(PG_DSN)
    rows = await conn.fetch(
        """
        SELECT s.session_id, s.is_completed_purchase, s.raw_session_payload
        FROM sessions.sessions s
        WHERE s.ended_at IS NOT NULL
        """
    )
    await conn.close()
    return rows


def build_dataframe(rows: list[asyncpg.Record], feature_cols: list[str]) -> pd.DataFrame:
    records = []
    for row in rows:
        payload_raw = row["raw_session_payload"] or {}
        if isinstance(payload_raw, str):
            payload = json.loads(payload_raw)
        else:
            payload = payload_raw
        record = {col: float(payload.get(col, 0.0)) for col in feature_cols}
        record["label"] = 0 if row["is_completed_purchase"] else 1
        records.append(record)
    df = pd.DataFrame(records)
    for col in feature_cols:
        df[col] = df[col].astype(float)
    return df


# ── Training ─────────────────────────────────────────────────────────────────


def train_variant(
    df: pd.DataFrame,
    feature_cols: list[str],
    variant_name: str,
) -> xgb.XGBClassifier:
    X = df[feature_cols].fillna(0.0)
    y = df["label"]

    unique_classes = y.unique()
    if len(unique_classes) < 2:
        print(f"[{variant_name}] Insufficient data: only {len(y)} samples with {len(unique_classes)} class(es)")
        print(f"[{variant_name}] Creating default model (cannot train with single class)")
        model = xgb.XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.05,
            subsample=0.8, colsample_bytree=0.8, eval_metric="logloss", random_state=42,
        )
        metrics = {
            "variant": variant_name, "auc_roc": None, "f1": None,
            "precision": None, "recall": None, "n_features": len(feature_cols),
            "n_train": 0, "status": "skipped - insufficient data",
            "trained_at": datetime.utcnow().isoformat(),
        }
        Path("./models").mkdir(parents=True, exist_ok=True)
        metrics_path = f"./models/metrics_{variant_name}.json"
        with open(metrics_path, "w") as f:
            json.dump(metrics, f, indent=2)
        print(f"[{variant_name}] Metrics saved to {metrics_path}\n")
        return model

    if len(X) < 10:
        print(f"[{variant_name}] Warning: Only {len(X)} samples, training on all data (no test set)")
        X_train, X_test = X, X
        y_train, y_test = y, y
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

    model = xgb.XGBClassifier(
        n_estimators=300, max_depth=6, learning_rate=0.05,
        subsample=0.8, colsample_bytree=0.8, eval_metric="logloss", random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=50)

    y_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_proba > 0.5).astype(int)

    auc = roc_auc_score(y_test, y_proba)
    print(f"\n[{variant_name}] Test AUC: {auc:.4f}")
    print(classification_report(y_test, y_pred))

    metrics = {
        "variant": variant_name,
        "auc_roc": float(auc),
        "f1": float(f1_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "n_features": len(feature_cols),
        "n_train": len(X_train),
        "trained_at": datetime.utcnow().isoformat(),
    }
    Path("./models").mkdir(parents=True, exist_ok=True)
    metrics_path = f"./models/metrics_{variant_name}.json"
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[{variant_name}] Metrics saved to {metrics_path}")

    return model


# ── Persistence ───────────────────────────────────────────────────────────────


def save_model_local(model: xgb.XGBClassifier, path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, path)
    print(f"Model saved locally: {path}")


def upload_to_minio(model: xgb.XGBClassifier, filename: str) -> None:
    client = Minio(
        MINIO_URL,
        access_key=os.environ["MINIO_ACCESS_KEY"],
        secret_key=os.environ["MINIO_SECRET_KEY"],
        secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
    )
    if not client.bucket_exists("models"):
        client.make_bucket("models")

    buf = io.BytesIO(pickle.dumps(model))
    buf.seek(0)
    client.put_object("models", filename, buf, length=buf.getbuffer().nbytes)
    print(f"Model uploaded to MinIO: models/{filename}")


# ── Entry point ───────────────────────────────────────────────────────────────


if __name__ == "__main__":
    rows = asyncio.run(load_data())

    all_fields: list[str] = []
    _seen_all: set[str] = set()
    for fields in FEATURE_SETS.values():
        for f in fields:
            if f not in _seen_all:
                _seen_all.add(f)
                all_fields.append(f)

    df_all = build_dataframe(rows, all_fields)
    print(f"Dataset: {len(df_all)} sessions, {df_all['label'].mean():.1%} abandonment rate")

    for variant_name, feature_cols in FEATURE_SETS.items():
        print(f"\n{'=' * 60}")
        print(f"Training variant: {variant_name} ({len(feature_cols)} features)")
        print("=" * 60)

        df_variant = df_all[feature_cols + ["label"]].copy()
        model = train_variant(df_variant, feature_cols, variant_name)

        local_path = MODEL_PATHS[variant_name]
        save_model_local(model, local_path)

        try:
            upload_to_minio(model, Path(local_path).name)
        except Exception as e:
            print(f"[{variant_name}] MinIO upload skipped: {e}")
