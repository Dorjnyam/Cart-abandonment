"""
API key extraction and tier resolution.

Key format: tk_basic_* | tk_smart_* | tk_full_* (prefix selects tier T3 / T2 / T1).

Transport (in order):
1. Header ``X-API-Key``
2. Header ``Authorization: Bearer <key>``
3. JSON body field ``api_key`` (handled in the route after parsing; see ``extract_api_key``).
"""

from __future__ import annotations

from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from observer.api_key_allowlist import is_key_in_allowlist
from observer.models.event import tier_from_key_prefix


def _header_bearer(request: Request) -> str | None:
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth or not auth.lower().startswith("bearer "):
        return None
    return auth[7:].strip() or None


def header_api_key_only(request: Request) -> str | None:
    """Key from headers only (safe for middleware before body is read)."""
    x = request.headers.get("x-api-key") or request.headers.get("X-API-Key")
    if x and x.strip():
        return x.strip()
    return _header_bearer(request)


def extract_api_key(request: Request, body: dict[str, Any] | None) -> str | None:
    """Resolve key: headers first, then body ``api_key``."""
    k = header_api_key_only(request)
    if k:
        return k
    if body and isinstance(body.get("api_key"), str) and body["api_key"].strip():
        return body["api_key"].strip()
    return None


def resolve_tier_for_key(key: str | None) -> str | None:
    if not key or not isinstance(key, str):
        return None
    k = key.strip()
    if not k:
        return None
    tier = tier_from_key_prefix(k)
    if not tier:
        return None
    if not is_key_in_allowlist(k):
        # Demo key prefix зөв байсан ч allowlist асаалттай үед зөвхөн бүртгэлтэй full key зөвшөөрнө.
        # Бодит API key болон demo API key-ийн ялгаа энд тодорхой болно.
        return None
    return tier


class APIKeyAuthMiddleware(BaseHTTPMiddleware):
    """
    Prefills ``request.state.observer_header_key`` and ``request.state.observer_header_tier``
    from headers so routes can require a key without reading the body twice.
    Body ``api_key`` is merged in the ingest handler.
    """

    async def dispatch(self, request: Request, call_next):
        hk = header_api_key_only(request)
        request.state.observer_header_key = hk
        request.state.observer_header_tier = resolve_tier_for_key(hk)
        return await call_next(request)
