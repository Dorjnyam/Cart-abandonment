from __future__ import annotations

from typing import Any


def _decode_hash(raw: dict[Any, Any]) -> dict[str, str]:
    decoded: dict[str, str] = {}
    for key, value in raw.items():
        decoded_key = key.decode() if isinstance(key, bytes) else str(key)
        decoded_val = value.decode() if isinstance(value, bytes) else str(value)
        decoded[decoded_key] = decoded_val
    return decoded


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default
