"""Map Observer Experiment ingest / Kafka payloads into Session ``RawEvent``."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any
from uuid import NAMESPACE_URL, UUID, uuid5

from app.config import DEFAULT_TENANT_ID
from app.models import RawEvent, RawEventPayload

logger = logging.getLogger(__name__)

# Top-level keys on Observer ``event_out`` (core + metadata). Rest becomes ``payload``.
OBSERVER_TOP_LEVEL_KEYS = frozenset(
    {
        "session_id",
        "visitor_id",
        "tenant_id",
        "event_type",
        "url",
        "referrer",
        "timestamp",
        "ip",
        "user_agent",
        "event_id",
        "tier",
        "bot_score",
    }
)


def _coerce_uuid(value: Any, *, kind: str) -> UUID | None:
    """
    Observer uses opaque string ids (e.g. ``s_...``, ``v_...``), not RFC-4122 UUID strings.

    If the value is not a valid UUID, map it deterministically with UUIDv5 so the same
    string always yields the same UUID (stable Redis / Kafka keys).
    """
    if value is None:
        return None
    if isinstance(value, UUID):
        return value
    s = str(value).strip()
    if not s:
        return None
    try:
        return UUID(s)
    except ValueError:
        namespace_key = f"observer:{kind}:{s}"
        mapped = uuid5(NAMESPACE_URL, namespace_key)
        logger.debug(
            "observer_adapter: mapped non-uuid %s to UUIDv5(%s...) -> %s",
            kind,
            s[:24],
            mapped,
        )
        return mapped


def resolve_session_id(value: Any) -> str | None:
    """Return canonical ``session_id`` string (UUID) for Redis keys and admin flush API."""
    sid = _coerce_uuid(value, kind="session_id")
    return str(sid) if sid is not None else None


def _parse_timestamp(value: Any) -> datetime:
    """Parse event time; always return timezone-aware UTC for consistent window scheduling."""
    if isinstance(value, datetime):
        dt = value
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    if value is None or value == "":
        return datetime.now(timezone.utc)
    s = str(value).strip()
    try:
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except ValueError:
        logger.warning("observer_adapter: bad timestamp=%r, using UTC now", value)
        return datetime.now(timezone.utc)


def _parse_bot_score(value: Any) -> float:
    if value is None:
        return 0.0
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _sanitize_observer_payload(payload_dict: dict[str, Any]) -> dict[str, Any]:
    """
    Observer sometimes sends ``\"\"`` for numeric fields; Pydantic rejects those for ``int`` types.
    Normalize empty strings to ``None`` and drop list/dict values for scalar payload fields.
    """
    out: dict[str, Any] = {}
    scalar_field_names = frozenset(RawEventPayload.model_fields.keys())
    for key, value in payload_dict.items():
        if value == "" or (isinstance(value, str) and not value.strip()):
            out[key] = None
            continue
        if key in scalar_field_names and isinstance(value, (list, dict)):
            continue
        out[key] = value
    return out


def observer_message_to_raw_event(body: dict[str, Any]) -> RawEvent | None:
    """
    Convert Observer ``event_out`` (Kafka or HTTP JSON) into ``RawEvent``.

    Observer does not send ``tenant_id``; use ``DEFAULT_TENANT_ID`` from config.
    """
    if not isinstance(body, dict):
        return None

    sid = _coerce_uuid(body.get("session_id"), kind="session_id")
    vid = _coerce_uuid(body.get("visitor_id"), kind="visitor_id")
    if sid is None or vid is None:
        return None

    tid = _coerce_uuid(body.get("tenant_id"), kind="tenant_id")
    if tid is None:
        tid = DEFAULT_TENANT_ID

    raw_et = body.get("event_type")
    if raw_et is None or (isinstance(raw_et, str) and not raw_et.strip()):
        logger.warning("observer_adapter: missing or empty event_type")
        return None
    event_type = str(raw_et).strip()

    payload_dict = _sanitize_observer_payload(
        {k: v for k, v in body.items() if k not in OBSERVER_TOP_LEVEL_KEYS}
    )
    try:
        payload = RawEventPayload.model_validate(payload_dict)
    except Exception as exc:
        logger.warning("observer_adapter: payload validation failed: %s", exc)
        return None

    return RawEvent(
        session_id=sid,
        visitor_id=vid,
        tenant_id=tid,
        event_type=event_type.strip(),
        payload=payload,
        timestamp=_parse_timestamp(body.get("timestamp")),
        bot_score=_parse_bot_score(body.get("bot_score")),
        url=body.get("url") or None,
        referrer=body.get("referrer") or None,
    )
