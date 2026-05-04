"""
Tests for session accumulation and flush logic.

Uses fakeredis so no real Redis is needed.
"""
from __future__ import annotations

import asyncio
import uuid
from unittest.mock import AsyncMock, call, patch

import pytest

from app.assembler import DEADLINE_ZSET, accumulate_event, flush_session
from app.config import BOT_THRESHOLD, SESSION_TTL_SECONDS
from app.models import SessionState
from app.utils import _decode_hash
from tests.conftest import make_event


# ── accumulate_event ──────────────────────────────────────────────────────────

async def test_accumulate_creates_session(fake_redis):
    event = make_event(event_type="page_view")
    await accumulate_event(fake_redis, event)

    raw = await fake_redis.hgetall(f"session:{event.session_id}")
    data = _decode_hash(raw)

    assert data["session_id"] == str(event.session_id)
    assert data["visitor_id"] == str(event.visitor_id)
    assert data["state"] == SessionState.NEW.value
    assert data["started_at"] != ""
    assert int(data["event_count"]) == 1


async def test_accumulate_updates_event_count(fake_redis):
    event = make_event(event_type="click")
    await accumulate_event(fake_redis, event)
    await accumulate_event(fake_redis, event)

    raw = await fake_redis.hgetall(f"session:{event.session_id}")
    data = _decode_hash(raw)
    assert int(data["event_count"]) == 2


async def test_accumulate_hincrby_counter_field(fake_redis):
    """rage_click is a COUNTER_FIELD — must use HINCRBY not Python RMW."""
    event1 = make_event(event_type="rage_click", rage_click=1)
    event2 = make_event(
        session_id=str(event1.session_id),
        visitor_id=str(event1.visitor_id),
        event_type="rage_click",
        rage_click=2,
    )
    await accumulate_event(fake_redis, event1)
    await accumulate_event(fake_redis, event2)

    data = _decode_hash(await fake_redis.hgetall(f"session:{event1.session_id}"))
    assert int(data["rage_click"]) == 3


async def test_accumulate_cart_add_uses_hincrby(fake_redis):
    event = make_event(event_type="add_to_cart")
    await accumulate_event(fake_redis, event)
    await accumulate_event(fake_redis, event)

    data = _decode_hash(await fake_redis.hgetall(f"session:{event.session_id}"))
    assert int(data["cart_add_count"]) == 2


async def test_accumulate_ttl_refreshed(fake_redis):
    event = make_event()
    await accumulate_event(fake_redis, event)

    ttl = await fake_redis.ttl(f"session:{event.session_id}")
    # TTL must be set and within [1, SESSION_TTL_SECONDS]
    assert 1 <= ttl <= SESSION_TTL_SECONDS


async def test_accumulate_deadline_zset_updated(fake_redis):
    event = make_event()
    await accumulate_event(fake_redis, event)

    score = await fake_redis.zscore(DEADLINE_ZSET, str(event.session_id))
    assert score is not None
    assert score > 0


# ── flush_session ─────────────────────────────────────────────────────────────

async def test_flush_db_written_before_kafka(fake_redis, monkeypatch):
    """DB write must happen before Kafka emit so the record is durable first."""
    call_order: list[str] = []

    async def fake_write(session_data):
        call_order.append("db")

    async def fake_emit(session_data, window_seconds):
        call_order.append("kafka")

    monkeypatch.setattr("app.assembler.write_session_to_pg", fake_write)
    monkeypatch.setattr("app.assembler.emit_session_enriched", fake_emit)

    event = make_event()
    await accumulate_event(fake_redis, event)
    await flush_session(fake_redis, str(event.session_id))

    assert call_order == ["db", "kafka"], f"Wrong order: {call_order}"


async def test_flush_kafka_fail_db_not_written(fake_redis, monkeypatch):
    """If DB write raises, Kafka emit must NOT be called."""
    db_called = []
    kafka_called = []

    async def failing_write(session_data):
        db_called.append(True)
        raise RuntimeError("DB down")

    async def should_not_be_called(session_data, window_seconds):
        kafka_called.append(True)

    monkeypatch.setattr("app.assembler.write_session_to_pg", failing_write)
    monkeypatch.setattr("app.assembler.emit_session_enriched", should_not_be_called)

    event = make_event()
    await accumulate_event(fake_redis, event)

    with pytest.raises(RuntimeError, match="DB down"):
        await flush_session(fake_redis, str(event.session_id))

    assert db_called, "DB write should have been attempted"
    assert not kafka_called, "Kafka must NOT be called when DB fails"


async def test_flush_db_fail_redis_key_not_deleted(fake_redis, monkeypatch):
    """If DB write raises, the Redis key must remain so a retry can re-read it."""
    async def failing_write(session_data):
        raise RuntimeError("DB down")

    async def fake_emit(session_data, window_seconds):
        pass

    monkeypatch.setattr("app.assembler.write_session_to_pg", failing_write)
    monkeypatch.setattr("app.assembler.emit_session_enriched", fake_emit)

    event = make_event()
    await accumulate_event(fake_redis, event)
    key = f"session:{event.session_id}"

    with pytest.raises(RuntimeError):
        await flush_session(fake_redis, str(event.session_id))

    # Key must still exist
    exists = await fake_redis.exists(key)
    assert exists, "Redis key must survive a failed flush so it can be retried"


async def test_flush_lock_prevents_double_kafka_emit(fake_redis, monkeypatch):
    """Two concurrent flush calls for the same session must emit to Kafka exactly once."""
    emit_count = 0

    async def counting_emit(session_data, window_seconds):
        nonlocal emit_count
        emit_count += 1

    async def fast_write(session_data):
        pass

    monkeypatch.setattr("app.assembler.write_session_to_pg", fast_write)
    monkeypatch.setattr("app.assembler.emit_session_enriched", counting_emit)

    event = make_event()
    await accumulate_event(fake_redis, event)

    # Fire two concurrent flushes — only one should win the lock
    await asyncio.gather(
        flush_session(fake_redis, str(event.session_id)),
        flush_session(fake_redis, str(event.session_id)),
    )

    assert emit_count == 1, f"Expected exactly 1 Kafka emit, got {emit_count}"


async def test_flush_redis_key_deleted_after_success(fake_redis, monkeypatch):
    monkeypatch.setattr("app.assembler.write_session_to_pg", AsyncMock())
    monkeypatch.setattr("app.assembler.emit_session_enriched", AsyncMock())

    event = make_event()
    await accumulate_event(fake_redis, event)
    key = f"session:{event.session_id}"

    assert await fake_redis.exists(key)
    await flush_session(fake_redis, str(event.session_id))
    assert not await fake_redis.exists(key)


# ── process_raw_event bot filter ───────────────────────────────────────────────

async def test_bot_score_above_threshold_skips_accumulate(fake_redis, monkeypatch):
    accumulated = []

    async def spy_accumulate(r, event):
        accumulated.append(event)

    monkeypatch.setattr("app.consumer.accumulate_event", spy_accumulate)

    from app.consumer import process_raw_event

    event = make_event(bot_score=BOT_THRESHOLD + 0.01)
    await process_raw_event(fake_redis, event)

    assert not accumulated, "Accumulate must not be called for bot events"


async def test_purchase_event_triggers_flush(fake_redis, monkeypatch):
    flushed = []

    async def spy_flush(r, session_id, end_reason="timeout"):
        flushed.append((session_id, end_reason))

    monkeypatch.setattr("app.consumer.flush_session", spy_flush)
    monkeypatch.setattr("app.consumer.accumulate_event", AsyncMock())
    monkeypatch.setattr("app.consumer.ensure_window_snapshot_tasks", AsyncMock(return_value=[]))

    from app.consumer import process_raw_event

    event = make_event(event_type="order_complete", is_order_success=True)
    await process_raw_event(fake_redis, event)

    assert flushed, "flush_session must be called for purchase events"
    assert flushed[0][1] == "purchase"
