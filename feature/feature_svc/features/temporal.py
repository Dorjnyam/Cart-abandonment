from __future__ import annotations

import math
from datetime import datetime
from typing import Any

import pandas as pd

def _parse_iso_ts(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def temporal_features(started_at: datetime, events: list[dict[str, Any]]) -> dict[str, float]:
    hour = started_at.hour
    dow = started_at.weekday()

    first_event_ts = events[0].get("timestamp") if events else None
    time_to_first = 0.0
    if first_event_ts:
        first_dt = _parse_iso_ts(str(first_event_ts))
        time_to_first = (first_dt - started_at).total_seconds()

    return {
        "hour_sin": math.sin(2 * math.pi * hour / 24),
        "hour_cos": math.cos(2 * math.pi * hour / 24),
        "dow_sin": math.sin(2 * math.pi * dow / 7),
        "dow_cos": math.cos(2 * math.pi * dow / 7),
        "time_to_first_action_ms": max(time_to_first * 1000.0, 0.0),
    }


def sequence_behavior_features(events: list[dict[str, Any]]) -> dict[str, float]:
    if not events:
        return {
            "scroll_depth_mean": 0.0,
            "click_count_explicit": 0.0,
            "mouse_move_count_explicit": 0.0,
            "time_on_page_mean": 0.0,
            "time_on_page_std": 0.0,
        }

    event_series = pd.Series([str(e.get("event_type", "")).lower() for e in events], dtype="string")
    scroll_depth_values = pd.Series(
        [float(e.get("max_scroll_pct", 0) or 0) for e in events if e.get("max_scroll_pct") is not None],
        dtype="float64",
    )
    time_on_page_values = pd.Series(
        [float(e.get("time_on_page_sec", 0) or 0) for e in events if e.get("time_on_page_sec") is not None],
        dtype="float64",
    )

    return {
        "scroll_depth_mean": float(scroll_depth_values.mean()) if not scroll_depth_values.empty else 0.0,
        "click_count_explicit": float(event_series.str.contains("click", regex=False).sum()),
        "mouse_move_count_explicit": float((event_series == "mousemove").sum()),
        "time_on_page_mean": float(time_on_page_values.mean()) if not time_on_page_values.empty else 0.0,
        "time_on_page_std": float(time_on_page_values.std(ddof=0)) if not time_on_page_values.empty else 0.0,
    }
