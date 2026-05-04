from __future__ import annotations

from typing import Any


def extract_raw(aggregated_fields: dict[str, Any]) -> dict[str, Any]:
    return dict(aggregated_fields)
