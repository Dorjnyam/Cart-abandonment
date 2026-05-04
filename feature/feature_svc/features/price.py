from __future__ import annotations

from typing import Any

import pandas as pd

from config import QUARTILE_BOUNDARIES


def _cart_value_quartile(af: dict[str, Any]) -> int:
    value = float(af.get("cart_value", 0) or 0)
    if value <= QUARTILE_BOUNDARIES[0]:
        return 1
    if value <= QUARTILE_BOUNDARIES[1]:
        return 2
    if value <= QUARTILE_BOUNDARIES[2]:
        return 3
    return 4


def price_hesitation_score(af: dict[str, Any]) -> float:
    triggered = (af.get("copy_count", 0) or 0) > 0 and (
        (af.get("tab_hidden_ms", 0) or 0) > 5000
        or (af.get("outbound_click", 0) or 0) > 0
    )
    if not triggered:
        return 0.0
    quartile = _cart_value_quartile(af)
    return quartile * 0.25


def avg_price_in_session(events: list[dict[str, Any]]) -> float:
    prices = pd.Series(
        [
            float(e["product_price"])
            for e in events
            if e.get("event_type") == "product_view" and e.get("product_price") is not None
        ],
        dtype="float64",
    )
    return float(prices.mean()) if not prices.empty else 0.0
