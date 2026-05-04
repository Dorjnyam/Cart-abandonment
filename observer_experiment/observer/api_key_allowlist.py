"""
Optional full-key allowlist. If ``OBSERVER_API_KEYS`` is unset or empty, only the
tier *prefix* is checked (dev-friendly). If set, the entire key string must match
one of the comma-separated values exactly — so changing a suffix or swapping
prefix without registering a new key fails.
"""

from __future__ import annotations

import os
from functools import lru_cache


@lru_cache(maxsize=1)
def _parsed_allowlist() -> frozenset[str] | None:
    raw = os.getenv("OBSERVER_API_KEYS", "").strip()
    if not raw:
        return None
    keys = frozenset(k.strip() for k in raw.split(",") if k.strip())
    return keys if keys else None


def allowlist_enabled() -> bool:
    return _parsed_allowlist() is not None


def allowed_keys_count() -> int:
    s = _parsed_allowlist()
    return len(s) if s else 0


def is_key_in_allowlist(key: str) -> bool:
    """If allowlist is disabled, returns True for any non-empty key (caller checks prefix)."""
    allowed = _parsed_allowlist()
    if allowed is None:
        return True
    return key.strip() in allowed


def reload_allowlist_cache() -> None:
    """Call after changing env in tests (optional)."""
    _parsed_allowlist.cache_clear()
