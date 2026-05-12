from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


TARGET_COLUMN = "label"
ID_COLUMNS = {"session_id", "visitor_id", "tenant_id", TARGET_COLUMN}
MODEL_VERSION = "xgboost-synthetic-mvp"
RANDOM_STATE = 42


def _metric_dict(y_true: np.ndarray, y_score: np.ndarray, threshold: float) -> dict[str, Any]:
    y_pred = (y_score >= threshold).astype(int)
    return {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_score)),
        "pr_auc": float(average_precision_score(y_true, y_score)),
        "threshold": float(threshold),
        "positive_support": int(np.sum(y_true == 1)),
        "negative_support": int(np.sum(y_true == 0)),
    }


def _tune_threshold(y_true: np.ndarray, y_score: np.ndarray) -> tuple[float, float]:
    best_threshold = 0.5
    best_f1 = -1.0
    for threshold in np.linspace(0.05, 0.95, 91):
        score = f1_score(y_true, (y_score >= threshold).astype(int), zero_division=0)
        if score > best_f1:
            best_f1 = float(score)
            best_threshold = float(threshold)
    return best_threshold, best_f1


def _feature_columns(df: pd.DataFrame) -> list[str]:
    return [col for col in df.columns if col not in ID_COLUMNS]


def _as_numeric_features(df: pd.DataFrame, feature_order: list[str]) -> pd.DataFrame:
    out = df[feature_order].copy()
    for column in feature_order:
        out[column] = pd.to_numeric(out[column], errors="coerce").fillna(0.0)
    return out.astype(float)


def train(dataset: Path, output: Path) -> dict[str, Any]:
    # Энэ training pipeline нь MVP synthetic/simulated dataset дээр ажиллана.
    # F1 болон бусад metric-ийг бодит хэрэглэгчийн production performance гэж тайлбарлаж болохгүй.
    df = pd.read_csv(dataset)
    if TARGET_COLUMN not in df.columns:
        raise SystemExit(f"Dataset must contain a '{TARGET_COLUMN}' column")

    feature_order = _feature_columns(df)
    X = _as_numeric_features(df, feature_order)
    y = df[TARGET_COLUMN].astype(int).to_numpy()

    X_train_full, X_test, y_train_full, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=RANDOM_STATE,
        stratify=y,
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train_full,
        y_train_full,
        test_size=0.25,
        random_state=RANDOM_STATE,
        stratify=y_train_full,
    )

    majority = DummyClassifier(strategy="most_frequent")
    majority.fit(X_train, y_train)
    majority_score = majority.predict_proba(X_test)[:, 1]

    logistic = make_pipeline(
        StandardScaler(),
        LogisticRegression(max_iter=1000, random_state=RANDOM_STATE),
    )
    logistic.fit(X_train, y_train)
    logistic_score = logistic.predict_proba(X_test)[:, 1]

    model = xgb.XGBClassifier(
        objective="binary:logistic",
        eval_metric="logloss",
        n_estimators=140,
        max_depth=3,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=RANDOM_STATE,
        n_jobs=2,
    )
    model.fit(X_train, y_train)
    val_score = model.predict_proba(X_val)[:, 1]
    best_threshold, best_val_f1 = _tune_threshold(y_val, val_score)
    xgb_score = model.predict_proba(X_test)[:, 1]
    xgb_pred = (xgb_score >= best_threshold).astype(int)

    metrics = {
        "dataset": str(dataset),
        "model_version": MODEL_VERSION,
        "synthetic_dataset": True,
        "split": {
            "train": int(len(y_train)),
            "validation": int(len(y_val)),
            "test": int(len(y_test)),
            "random_state": RANDOM_STATE,
            "stratified": True,
        },
        "models": {
            "majority": _metric_dict(y_test, majority_score, 0.5),
            "logistic_regression": _metric_dict(y_test, logistic_score, 0.5),
            "xgboost": _metric_dict(y_test, xgb_score, best_threshold),
        },
        "threshold_tuning": {
            "best_threshold": best_threshold,
            "validation_f1": best_val_f1,
        },
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    artifact = {
        "model": model,
        "feature_order": feature_order,
        "threshold": best_threshold,
        "model_version": MODEL_VERSION,
    }
    joblib.dump(artifact, output)

    metrics_dir = output.parent
    (metrics_dir / "feature_order.json").write_text(json.dumps(feature_order, indent=2), encoding="utf-8")
    (metrics_dir / "metrics_xgboost.json").write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    (metrics_dir / "confusion_matrix.json").write_text(
        json.dumps({
            "labels": ["converted", "abandoned"],
            "matrix": confusion_matrix(y_test, xgb_pred, labels=[0, 1]).tolist(),
        }, indent=2),
        encoding="utf-8",
    )
    (metrics_dir / "classification_report.json").write_text(
        json.dumps(classification_report(y_test, xgb_pred, output_dict=True, zero_division=0), indent=2),
        encoding="utf-8",
    )
    (metrics_dir / "dataset_metadata.json").write_text(
        json.dumps({
            "rows": int(len(df)),
            "features": len(feature_order),
            "positive_abandoned": int(np.sum(y == 1)),
            "negative_converted": int(np.sum(y == 0)),
            "label_definition": "1 = abandoned checkout/session, 0 = converted purchase_success",
            "synthetic": True,
            "future_leakage_guard": "Outcome columns are excluded from feature_order.",
        }, indent=2),
        encoding="utf-8",
    )
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the thesis MVP XGBoost abandonment model.")
    parser.add_argument("--dataset", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    metrics = train(args.dataset, args.output)
    print(json.dumps(metrics["models"], indent=2))


if __name__ == "__main__":
    main()
