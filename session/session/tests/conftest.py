from __future__ import annotations

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import fakeredis.aioredis

from app.models import RawEvent, RawEventPayload


# ── Redis fixture ─────────────────────────────────────────────────────────────

@pytest.fixture
async def fake_redis():
    """In-process async Redis backed by fakeredis — no real Redis needed."""
    r = fakeredis.aioredis.FakeRedis(decode_responses=False)
    yield r
    await r.aclose()


# ── Event factory ─────────────────────────────────────────────────────────────

def make_event(
    session_id: str | None = None,
    visitor_id: str | None = None,
    event_type: str = "page_view",
    bot_score: float = 0.0,
    **payload_kwargs,
) -> RawEvent:
    return RawEvent(
        session_id=uuid.UUID(session_id) if session_id else uuid.uuid4(),
        visitor_id=uuid.UUID(visitor_id) if visitor_id else uuid.uuid4(),
        tenant_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        event_type=event_type,
        payload=RawEventPayload(**payload_kwargs),
        timestamp=datetime.now(timezone.utc),
        bot_score=bot_score,
        event_id=str(uuid.uuid4()),
    )


@pytest.fixture
def sample_event() -> RawEvent:
    return make_event()


# ── I/O mock fixtures ─────────────────────────────────────────────────────────

@pytest.fixture
def mock_emit(monkeypatch):
    """Patch emit_session_enriched to a no-op async mock."""
    m = AsyncMock(return_value=None)
    monkeypatch.setattr("app.assembler.emit_session_enriched", m, raising=False)
    # Also patch the import inside flush_session's local import
    monkeypatch.setattr("app.emitter.emit_session_enriched", m, raising=False)
    return m


@pytest.fixture
def mock_write_pg(monkeypatch):
    """Patch write_session_to_pg to a no-op async mock."""
    m = AsyncMock(return_value=None)
    monkeypatch.setattr("app.assembler.write_session_to_pg", m, raising=False)
    monkeypatch.setattr("app.db.write_session_to_pg", m, raising=False)
    return m
