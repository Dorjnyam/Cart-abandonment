from __future__ import annotations

from config import FRUSTRATION_WEIGHTS


def frustration_index(af: dict) -> float:
    w = FRUSTRATION_WEIGHTS
    score = (
        float(af.get("rage_click", 0) or 0) * w[0]
        + float(af.get("back_navigation", 0) or 0) * w[1]
        + float(af.get("js_error", 0) or 0) * w[2]
        + float(af.get("cart_churn_count", 0) or 0) * w[3]
    )
    return min(score, 1.0)
