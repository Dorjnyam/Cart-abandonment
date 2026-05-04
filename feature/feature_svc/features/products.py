from __future__ import annotations

from typing import Any


def dist_product_count(events: list[dict[str, Any]]) -> int:
    return len({e["product_id"] for e in events if e.get("product_id")})
