from __future__ import annotations

import math
from typing import Any


def compute_mouse_features(events: list[dict[str, Any]]) -> dict[str, float | int]:
    points: list[tuple[float, float]] = []
    for e in events:
        x = e.get("mouse_x")
        y = e.get("mouse_y")
        if x is not None and y is not None:
            try:
                points.append((float(x), float(y)))
            except (TypeError, ValueError):
                continue

    if len(points) < 2:
        return {"mouse_distance": 0.0, "mouse_speed": 0.0, "direction_changes": 0}

    distances = [
        math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1])
        for i in range(1, len(points))
    ]
    total_distance = sum(distances)

    active_time_ms = sum(
        float(e.get("active_time_ms", 0) or 0) for e in events
    )
    mouse_speed = total_distance / max(active_time_ms, 1.0) * 1000.0

    changes = 0
    if len(points) >= 3:
        for i in range(1, len(points) - 1):
            ax, ay = points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]
            bx, by = points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]
            mag_a = math.hypot(ax, ay)
            mag_b = math.hypot(bx, by)
            if mag_a < 1e-9 or mag_b < 1e-9:
                continue
            cos_theta = (ax * bx + ay * by) / (mag_a * mag_b)
            cos_theta = max(-1.0, min(1.0, cos_theta))
            angle_deg = math.degrees(math.acos(cos_theta))
            if angle_deg > 45.0:
                changes += 1

    return {
        "mouse_distance": total_distance,
        "mouse_speed": mouse_speed,
        "direction_changes": changes,
    }
