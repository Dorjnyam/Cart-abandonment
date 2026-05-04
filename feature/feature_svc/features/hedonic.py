from __future__ import annotations

import logging
from typing import Any

import pandas as pd

from config import HEDONIC_CATEGORIES

logger = logging.getLogger(__name__)


def safe_ratio(numerator: float, denominator: float, default: float = 0.0) -> float:
    if denominator in (0, None):
        return default
    return numerator / denominator


def hedonic_ratio(events: list[dict[str, Any]], af: dict[str, Any]) -> float:
    del af
    cart_items = [e for e in events if e.get("event_type") == "cart_add"]
    if not cart_items:
        return 0.0
    categories = pd.Series(
        [str(e.get("product_category", "")).strip().lower() for e in cart_items],
        dtype="string",
    )
    if categories.replace("", pd.NA).dropna().empty:
        logger.warning("product_category missing for all cart_add events")
        return 0.0
    hedonic = categories.isin(HEDONIC_CATEGORIES).sum()
    return safe_ratio(float(hedonic), float(len(cart_items)))
