"""Dev helpers: validate tier prefix and generate random API key strings (not stored server-side)."""

from __future__ import annotations

import secrets

from observer.api_key_allowlist import allowlist_enabled, is_key_in_allowlist
from observer.models.event import tier_from_key_prefix

_PREFIX_BY_TIER: dict[str, str] = {"T3": "tk_basic_", "T2": "tk_smart_", "T1": "tk_full_"}


def validate_key_string(key: str | None) -> dict:
    if key is None or not isinstance(key, str):
        return {
            "valid": False,
            "tier": None,
            "message": "Key is missing or not a string.",
        }
    k = key.strip()
    if not k:
        return {
            "valid": False,
            "tier": None,
            "message": "Key is empty.",
        }
    tier = tier_from_key_prefix(k)
    if not tier:
        return {
            "valid": False,
            "tier": None,
            "allowlist_active": allowlist_enabled(),
            "message": "Invalid: must start with tk_basic_, tk_smart_, or tk_full_",
        }
    if not is_key_in_allowlist(k):
        return {
            "valid": False,
            "tier": None,
            "allowlist_active": True,
            "message": "Prefix looks valid, but this exact key is not registered in OBSERVER_API_KEYS.",
        }
    return {
        "valid": True,
        "tier": tier,
        "allowlist_active": allowlist_enabled(),
        "message": (
            f"Valid; tier {tier}. "
            + (
                "Key is on the server allowlist."
                if allowlist_enabled()
                else "Allowlist is off — any suffix after a valid prefix is accepted."
            )
        ),
    }


def normalize_tier(tier: str | None) -> str | None:
    if not tier or not isinstance(tier, str):
        return None
    u = tier.strip().upper()
    if u in ("T1", "FULL", "TK_FULL"):
        return "T1"
    if u in ("T2", "SMART", "TK_SMART"):
        return "T2"
    if u in ("T3", "BASIC", "TK_BASIC"):
        return "T3"
    return None


def generate_key(tier: str) -> tuple[str, str]:
    """
    Return (full_key, tier) e.g. (\"tk_basic_deadbeef...\", \"T3\").
    """
    t = normalize_tier(tier)
    if not t:
        raise ValueError("tier must be T1, T2, or T3 (or basic/smart/full)")
    prefix = _PREFIX_BY_TIER[t]
    suffix = secrets.token_hex(16)
    return prefix + suffix, t
