from __future__ import annotations

import json
from pathlib import Path
from textwrap import fill

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from joblib import load as joblib_load
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parents[2]
EVIDENCE_PATH = ROOT / "docs" / "defense_evidence" / "defense_evidence.json"
MODEL_ARTIFACT_PATH = ROOT / "docs" / "defense_evidence" / "model_eval_run" / "xgb_cart_abandonment.joblib"
OUTPUT_DIR = ROOT / "docs" / "defense_evidence" / "ml_diagrams"

COLORS = {
    "emerald": "#1F4D3E",
    "emerald_light": "#DCE8E1",
    "blue": "#3E6E8E",
    "blue_light": "#D8E4EC",
    "honey": "#9C6B14",
    "honey_light": "#F2E2BD",
    "clay": "#A03521",
    "clay_light": "#E9C8BE",
    "linen": "#F7F4EC",
    "surface": "#FFFCF7",
    "ink": "#151515",
    "muted": "#5F6460",
    "hairline": "#D8D2C8",
}


def load_evidence() -> dict:
    if not EVIDENCE_PATH.exists():
        raise FileNotFoundError(f"Evidence file not found: {EVIDENCE_PATH}")
    return json.loads(EVIDENCE_PATH.read_text(encoding="utf-8"))


def setup_style() -> None:
    plt.rcParams.update(
        {
            "font.family": ["DejaVu Sans", "Arial", "sans-serif"],
            "axes.facecolor": COLORS["surface"],
            "figure.facecolor": COLORS["surface"],
            "axes.edgecolor": COLORS["hairline"],
            "axes.labelcolor": COLORS["ink"],
            "xtick.color": COLORS["muted"],
            "ytick.color": COLORS["muted"],
            "text.color": COLORS["ink"],
            "axes.titleweight": "bold",
            "axes.titlesize": 17,
            "axes.labelsize": 11,
            "figure.dpi": 160,
            "savefig.dpi": 220,
        }
    )
    sns.set_theme(style="whitegrid", rc={"font.family": "DejaVu Sans"})


def save_figure(fig: plt.Figure, name: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for ext in ("png", "svg"):
        fig.savefig(
            OUTPUT_DIR / f"{name}.{ext}",
            bbox_inches="tight",
            facecolor=fig.get_facecolor(),
        )
    plt.close(fig)


def add_header(fig: plt.Figure, title: str, subtitle: str | None = None) -> None:
    fig.text(0.04, 0.94, title, fontsize=20, fontweight="bold", color=COLORS["ink"])
    if subtitle:
        fig.text(0.04, 0.9, subtitle, fontsize=10.5, color=COLORS["muted"])


def draw_box(ax: plt.Axes, x: float, y: float, w: float, h: float, title: str, body: str, color: str) -> None:
    patch = FancyBboxPatch(
        (x, y),
        w,
        h,
        boxstyle="round,pad=0.018,rounding_size=0.035",
        linewidth=1.1,
        edgecolor=color,
        facecolor=COLORS["surface"],
    )
    ax.add_patch(patch)
    ax.text(x + w / 2, y + h * 0.62, title, ha="center", va="center", fontsize=11.5, fontweight="bold", color=color)
    ax.text(x + w / 2, y + h * 0.34, body, ha="center", va="center", fontsize=8.8, color=COLORS["muted"])


def draw_arrow(ax: plt.Axes, start: tuple[float, float], end: tuple[float, float]) -> None:
    ax.add_patch(
        FancyArrowPatch(
            start,
            end,
            arrowstyle="-|>",
            mutation_scale=13,
            linewidth=1.2,
            color=COLORS["muted"],
            shrinkA=5,
            shrinkB=5,
        )
    )


def draw_ml_pipeline(evidence: dict) -> None:
    model = evidence["model"]
    fig, ax = plt.subplots(figsize=(14, 6.5))
    add_header(
        fig,
        "Машин сургалтын дамжлага",
        "Raw events → Session → Feature vector → XGBoost → Probability → SHAP → S1-S7 → Recommendation",
    )
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    steps = [
        ("Түүхий event", "Observer\nservice"),
        ("Сесс нэгтгэл", "Session\nservice"),
        ("Шинж вектор", f"{model['feature_count']} feature"),
        ("XGBoost", model["model_version"]),
        ("Орхих магадлал", f"threshold={model['threshold']:.2f}"),
        ("SHAP тайлбар", "feature impact"),
        ("S1-S7 онош", "7 шалтгаан"),
        ("Зөвлөмж", "Main service"),
    ]
    palette = [
        COLORS["emerald"],
        COLORS["blue"],
        COLORS["honey"],
        COLORS["emerald"],
        COLORS["clay"],
        COLORS["blue"],
        COLORS["honey"],
        COLORS["emerald"],
    ]

    x0, y0, w, h, gap = 0.035, 0.46, 0.105, 0.22, 0.018
    centers = []
    for idx, ((title, body), color) in enumerate(zip(steps, palette)):
        x = x0 + idx * (w + gap)
        draw_box(ax, x, y0, w, h, title, body, color)
        centers.append((x + w, y0 + h / 2, x, y0 + h / 2))
    for idx in range(len(steps) - 1):
        draw_arrow(ax, (centers[idx][0], centers[idx][1]), (centers[idx + 1][2], centers[idx + 1][3]))

    note = (
        "Энэ зураг нь хамгаалалтын demo-д ашиглах локал системийн ML урсгалыг харуулна. "
        "Үнэлгээний өгөгдөл нь синтетик/симуляц бөгөөд бодит хэрэглэгчийн production баталгаа биш."
    )
    ax.text(0.04, 0.22, fill(note, 125), fontsize=10, color=COLORS["muted"], va="top")
    save_figure(fig, "01_ml_pipeline_diagram")


def draw_train_test_split(evidence: dict) -> None:
    dataset = evidence["dataset"]
    total = int(dataset["n_total"])
    train = int(dataset["n_train"])
    test = int(dataset["n_test"])
    validation = total - train - test

    labels = ["Сургалт", "Validation", "Test"]
    values = [train, validation, test]
    colors = [COLORS["emerald"], COLORS["honey"], COLORS["blue"]]

    fig, ax = plt.subplots(figsize=(11, 5.8))
    add_header(
        fig,
        "Сургалт ба шалгалтын өгөгдлийн хуваалт",
        f"Нийт {total} синтетик session · stratified split · random_state={dataset['random_state']}",
    )
    ax.set_xlim(0, total)
    ax.set_ylim(-0.8, 1.4)
    ax.axis("off")

    left = 0
    for label, value, color in zip(labels, values, colors):
        ax.barh(0, value, left=left, height=0.45, color=color, edgecolor=COLORS["surface"])
        pct = value / total * 100
        ax.text(left + value / 2, 0, f"{label}\n{value} ({pct:.0f}%)", ha="center", va="center", fontsize=12, color="white", fontweight="bold")
        left += value

    ax.text(0, 0.62, f"Positive abandoned: {dataset['positive_abandoned']}", fontsize=11, color=COLORS["clay"], fontweight="bold")
    ax.text(total * 0.38, 0.62, f"Negative converted: {dataset['negative_converted']}", fontsize=11, color=COLORS["emerald"], fontweight="bold")
    ax.text(
        0,
        -0.55,
        "Зорилго: загварыг сургах өгөгдлөөс тусдаа validation/test хэсгээр шалгаж, abandoned болон converted ангиллыг шударгаар үнэлэх.",
        fontsize=10.5,
        color=COLORS["muted"],
    )
    save_figure(fig, "02_train_validation_test_split")


def draw_confusion_matrix(evidence: dict) -> None:
    metrics = evidence["metrics"]
    cm = metrics["confusion_matrix"]
    # Rows are actual classes, columns are predicted classes.
    values = np.array([[cm["tp"], cm["fn"]], [cm["fp"], cm["tn"]]])
    labels = np.array(
        [
            [f"TP\n{cm['tp']}", f"FN\n{cm['fn']}"],
            [f"FP\n{cm['fp']}", f"TN\n{cm['tn']}"],
        ]
    )

    fig, ax = plt.subplots(figsize=(7.5, 6.5))
    add_header(fig, "Төөрөгдлийн матриц", f"XGBoost · threshold={evidence['model']['threshold']:.2f} · accuracy={metrics['accuracy']:.3f}")
    sns.heatmap(
        values,
        annot=labels,
        fmt="",
        cmap=sns.light_palette(COLORS["emerald"], as_cmap=True),
        cbar=False,
        linewidths=1,
        linecolor=COLORS["surface"],
        annot_kws={"fontsize": 17, "fontweight": "bold", "color": COLORS["ink"]},
        ax=ax,
    )
    ax.set_xticklabels(["Таамаг: орхисон", "Таамаг: худалдан авсан"], rotation=0)
    ax.set_yticklabels(["Бодит: орхисон", "Бодит: худалдан авсан"], rotation=0)
    ax.set_xlabel("")
    ax.set_ylabel("")
    ax.tick_params(length=0)
    save_figure(fig, "03_confusion_matrix")


def draw_classification_metrics(evidence: dict) -> None:
    metrics = evidence["metrics"]
    names = ["Precision", "Recall", "F1", "Accuracy", "ROC AUC"]
    values = [metrics["precision"], metrics["recall"], metrics["f1"], metrics["accuracy"], metrics["roc_auc"]]
    colors = [COLORS["emerald"], COLORS["blue"], COLORS["honey"], COLORS["muted"], COLORS["clay"]]

    fig, ax = plt.subplots(figsize=(10, 6))
    add_header(fig, "Ангиллын үнэлгээний үзүүлэлтүүд", "Abandoned vs Converted classification")
    bars = ax.bar(names, values, color=colors, width=0.62)
    ax.set_ylim(0, 1.0)
    ax.set_ylabel("Оноо")
    ax.grid(axis="y", color=COLORS["hairline"], linewidth=0.8, alpha=0.8)
    ax.grid(axis="x", visible=False)
    for spine in ["top", "right", "left"]:
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(COLORS["hairline"])
    for bar, value in zip(bars, values):
        ax.text(
            bar.get_x() + bar.get_width() / 2,
            value + 0.025,
            f"{value:.3f}",
            ha="center",
            va="bottom",
            fontsize=12,
            fontweight="bold",
            color=COLORS["ink"],
        )
    ax.text(
        -0.45,
        -0.22,
        "Precision: орхисон гэж таамагласан session үнэхээр орхисон байх хувь. "
        "Recall: бодитоор орхисон session-үүдийг илрүүлсэн хувь. "
        "F1: precision ба recall-ийн тэнцвэр.",
        transform=ax.transAxes,
        fontsize=9.8,
        color=COLORS["muted"],
    )
    save_figure(fig, "04_precision_recall_f1_bar")


def draw_shap_feature_impact(evidence: dict) -> None:
    example = evidence["one_session_example"]
    shap_values = example["prediction"]["shap_values"]
    sorted_items = sorted(shap_values.items(), key=lambda item: abs(item[1]), reverse=True)[:8]
    features = [item[0] for item in sorted_items][::-1]
    values = [abs(item[1]) for item in sorted_items][::-1]

    fig, ax = plt.subplots(figsize=(10.5, 6.6))
    add_header(
        fig,
        "SHAP шинжүүдийн нөлөөлөл",
        f"Жишээ session: {example['session_id_masked']} · P(abandon)={example['prediction']['abandon_probability']:.3f}",
    )
    bars = ax.barh(features, values, color=COLORS["blue"], height=0.62)
    ax.set_xlabel("|SHAP утга|")
    ax.grid(axis="x", color=COLORS["hairline"], linewidth=0.8, alpha=0.8)
    ax.grid(axis="y", visible=False)
    for spine in ["top", "right", "left"]:
        ax.spines[spine].set_visible(False)
    ax.spines["bottom"].set_color(COLORS["hairline"])
    ax.tick_params(axis="y", length=0, labelsize=10.5)
    for bar, value in zip(bars, values):
        ax.text(value + max(values) * 0.025, bar.get_y() + bar.get_height() / 2, f"{value:.3f}", va="center", fontsize=10, color=COLORS["ink"])

    diagnosis = example["diagnosis"]
    ax.text(
        0,
        -0.18,
        f"S1-S7 оношлогооны dominant reason: {diagnosis['dominant_reason']} · "
        "Энэ bar chart нь тухайн session дээр ямар feature орхилт руу хамгийн хүчтэй түлхэж байгааг энгийнээр харуулна.",
        transform=ax.transAxes,
        fontsize=9.8,
        color=COLORS["muted"],
    )
    save_figure(fig, "05_shap_feature_impact")


def load_xgboost_test_scores(evidence: dict) -> tuple[np.ndarray, np.ndarray, float]:
    dataset_path = ROOT / evidence["dataset"]["source_path_or_table"]
    if not dataset_path.exists():
        raise FileNotFoundError(f"Dataset file not found: {dataset_path}")
    if not MODEL_ARTIFACT_PATH.exists():
        raise FileNotFoundError(f"Model artifact not found: {MODEL_ARTIFACT_PATH}")

    artifact = joblib_load(MODEL_ARTIFACT_PATH)
    if not isinstance(artifact, dict) or "model" not in artifact:
        raise TypeError("Expected model artifact dictionary with a 'model' key")

    model = artifact["model"]
    feature_order = artifact.get("feature_order") or artifact.get("feature_names")
    if not feature_order:
        raise ValueError("Model artifact does not contain feature order")

    df = pd.read_csv(dataset_path)
    X = df[list(feature_order)].copy()
    for column in feature_order:
        X[column] = pd.to_numeric(X[column], errors="coerce").fillna(0.0)
    X = X.astype(float)
    y = df["label"].astype(int).to_numpy()

    _x_train_full, x_test, _y_train_full, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )
    y_score = model.predict_proba(x_test)[:, 1]
    auc_value = float(roc_auc_score(y_test, y_score))
    return y_test, y_score, auc_value


def draw_roc_curve(evidence: dict) -> None:
    y_test, y_score, auc_value = load_xgboost_test_scores(evidence)
    fpr, tpr, thresholds = roc_curve(y_test, y_score)

    fig, ax = plt.subplots(figsize=(8.2, 7.2))
    add_header(fig, "ROC муруй", "Abandoned vs Converted ялгах чадвар")
    ax.plot(fpr, tpr, color=COLORS["emerald"], linewidth=2.8, label=f"XGBoost AUC = {auc_value:.3f}")
    ax.plot([0, 1], [0, 1], color=COLORS["muted"], linewidth=1.2, linestyle="--", label="Санамсаргүй baseline")
    ax.fill_between(fpr, tpr, alpha=0.14, color=COLORS["emerald"])
    ax.scatter([fpr[np.argmax(tpr - fpr)]], [tpr[np.argmax(tpr - fpr)]], s=58, color=COLORS["clay"], zorder=4)

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1.02)
    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.grid(color=COLORS["hairline"], linewidth=0.8, alpha=0.85)
    ax.legend(loc="lower right", frameon=True, facecolor=COLORS["surface"], edgecolor=COLORS["hairline"])
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    ax.spines["left"].set_color(COLORS["hairline"])
    ax.spines["bottom"].set_color(COLORS["hairline"])

    best_idx = int(np.argmax(tpr - fpr))
    ax.text(
        0.03,
        0.08,
        f"Test split: {len(y_test)} session\nAUC evidence: {evidence['metrics']['roc_auc']:.3f}\nNearest ROC threshold: {thresholds[best_idx]:.3f}",
        transform=ax.transAxes,
        fontsize=9.6,
        color=COLORS["muted"],
        bbox={"boxstyle": "round,pad=0.45", "facecolor": COLORS["linen"], "edgecolor": COLORS["hairline"]},
    )

    points = {
        "auc": auc_value,
        "source_dataset": str(evidence["dataset"]["source_path_or_table"]),
        "model_artifact": str(MODEL_ARTIFACT_PATH.relative_to(ROOT)),
        "fpr": [float(x) for x in fpr],
        "tpr": [float(x) for x in tpr],
        "thresholds": [float(x) for x in thresholds],
    }
    (OUTPUT_DIR / "06_roc_curve_points.json").write_text(json.dumps(points, indent=2), encoding="utf-8")
    save_figure(fig, "06_roc_curve")


def write_summary(evidence: dict) -> None:
    metrics = evidence["metrics"]
    dataset = evidence["dataset"]
    summary = f"""# ML хамгаалалтын зурагнууд

Энэ хавтас дахь зургуудыг `scripts/audit/generate_ml_defense_diagrams.py` автоматаар үүсгэсэн.

Эх сурвалж: `docs/defense_evidence/defense_evidence.json`

- Өгөгдөл: `{dataset["source_path_or_table"]}` synthetic/simulated dataset
- Нийт session: {dataset["n_total"]}
- Split: {dataset["n_train"]} train / {dataset["n_total"] - dataset["n_train"] - dataset["n_test"]} validation / {dataset["n_test"]} test
- Model: {evidence["model"]["algorithm"]} ({evidence["model"]["model_version"]})
- Threshold: {evidence["model"]["threshold"]:.2f}
- Accuracy: {metrics["accuracy"]:.3f}
- Precision: {metrics["precision"]:.3f}
- Recall: {metrics["recall"]:.3f}
- F1: {metrics["f1"]:.3f}
- ROC AUC: {metrics["roc_auc"]:.3f}

## Файлууд

1. `01_ml_pipeline_diagram.png` - Машин сургалтын дамжлага
2. `02_train_validation_test_split.png` - Сургалт/validation/test хуваалт
3. `03_confusion_matrix.png` - Төөрөгдлийн матриц
4. `04_precision_recall_f1_bar.png` - Ангиллын metric bar chart
5. `05_shap_feature_impact.png` - SHAP feature impact chart
6. `06_roc_curve.png` - ROC муруй ба AUC
7. `06_roc_curve_points.json` - ROC curve-ийн raw FPR/TPR утгууд

Тайлбар: Энэ нь дипломын хамгаалалтын demo readiness-д зориулсан синтетик/симуляц үнэлгээ. Бодит хэрэглэгчийн production performance гэж тайлбарлаж болохгүй.
"""
    (OUTPUT_DIR / "README.md").write_text(summary, encoding="utf-8")


def main() -> None:
    evidence = load_evidence()
    setup_style()
    draw_ml_pipeline(evidence)
    draw_train_test_split(evidence)
    draw_confusion_matrix(evidence)
    draw_classification_metrics(evidence)
    draw_shap_feature_impact(evidence)
    draw_roc_curve(evidence)
    write_summary(evidence)
    print(f"Generated ML defense diagrams in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
