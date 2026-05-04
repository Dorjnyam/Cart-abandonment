"""
Optional HTTP forwarder to Session Service.

Purpose:
    After Observer persists an event, forward the same event JSON to a session
    service endpoint (e.g. localhost:8002) without breaking ingest on errors.

Environment:
    SESSION_SERVICE_URL=http://localhost:8002/ingest/raw-event   (full endpoint)
    SESSION_SERVICE_TIMEOUT_MS=1500                              (optional)
    SESSION_SERVICE_API_KEY=...                                  (optional, sent as X-API-Key)

Behavior:
    - If SESSION_SERVICE_URL is missing, forwarding is disabled.
    - All failures are swallowed and logged; ingest remains 200.
"""

from __future__ import annotations

import asyncio
import logging
from typing import Any

from observer.config import settings

logger = logging.getLogger(__name__)

_client = None  # httpx.AsyncClient | None
_url = ""
_timeout_ms = 1500
_api_key = ""


async def start_session_forwarder() -> bool:
    """Create reusable async HTTP client. Returns True when enabled."""
    global _client, _url, _timeout_ms, _api_key
    _url = settings.session_service_url.strip()
    if not _url:
        logger.info("SESSION_SERVICE_URL not set — session forwarder disabled")
        return False

    _api_key = settings.session_service_api_key.strip()
    _timeout_ms = settings.session_service_timeout_ms

    try:
        import httpx

        _client = httpx.AsyncClient(timeout=_timeout_ms / 1000.0)
        logger.info(
            "Session forwarder enabled (url=%s, timeout_ms=%s)",
            _url,
            _timeout_ms,
        )
        return True
    except ImportError:
        logger.warning("httpx not installed — session forwarder disabled")
        _client = None
        return False
    except Exception as exc:
        logger.warning("Session forwarder init failed (%s) — disabled", exc)
        _client = None
        return False


async def stop_session_forwarder() -> None:
    global _client
    if _client is None:
        return
    try:
        await _client.aclose()
    except Exception as exc:
        logger.warning("Session forwarder shutdown error: %s", exc)
    finally:
        _client = None


def session_forwarder_enabled() -> bool:
    return _client is not None and bool(_url)


_MAX_ATTEMPTS = 3
_RETRY_DELAY_S = 0.5


async def forward_event(event: dict[str, Any]) -> bool:
    """
    Forward one event to Session Service endpoint.
    Retries up to 3 times with 0.5 s between attempts.
    Returns True on success, False otherwise. Never raises.
    """
    if _client is None or not _url:
        return False

    headers = {"Content-Type": "application/json"}
    if _api_key:
        headers["X-API-Key"] = _api_key

    for attempt in range(1, _MAX_ATTEMPTS + 1):
        try:
            resp = await _client.post(_url, json=event, headers=headers)
            if resp.status_code < 300:
                return True
            logger.warning(
                "Session forward failed status=%s url=%s attempt=%s/%s body=%s",
                resp.status_code,
                _url,
                attempt,
                _MAX_ATTEMPTS,
                (resp.text[:300] if resp.text else ""),
            )
        except Exception as exc:
            logger.warning(
                "Session forward error (attempt %s/%s): %s", attempt, _MAX_ATTEMPTS, exc
            )

        if attempt < _MAX_ATTEMPTS:
            await asyncio.sleep(_RETRY_DELAY_S)

    return False

