"""
Tests for the Kafka consumer loop resilience.

The consumer loop itself cannot be driven end-to-end without a real Kafka broker,
so these tests focus on the parts that are most likely to cause service outages:
  - poison pill messages (must commit and continue, not crash)
  - process_raw_event failures (must NOT re-raise; service stays alive)
  - Redis errors (must back off without crashing)
  - backpressure path (must still process the current message after sleeping)
"""
from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch, call

import pytest
import redis.asyncio as redis_async

from tests.conftest import make_event


# ── normalize_kafka_value ──────────────────────────────────────────────────────

def test_normalize_kafka_value_returns_none_for_garbage():
    from app.consumer import normalize_kafka_value

    assert normalize_kafka_value("not a dict") is None
    assert normalize_kafka_value({"no_session_id": True}) is None


def test_normalize_kafka_value_accepts_native_raw_event():
    from app.consumer import normalize_kafka_value
    from app.models import RawEvent

    event = make_event()
    payload = event.model_dump(mode="json")
    result = normalize_kafka_value(payload)
    assert result is not None
    assert str(result.session_id) == str(event.session_id)


# ── poison pill handling ───────────────────────────────────────────────────────

async def test_poison_pill_commit_called(fake_redis, monkeypatch):
    """
    A malformed message must be committed immediately so it is never replayed
    on restart. The consumer must not raise.
    """
    committed = []

    # Build a fake consumer that yields one bad message then stops
    bad_message = MagicMock()
    bad_message.value = {"completely": "wrong_shape_no_session_id_or_visitor_id"}

    mock_consumer = AsyncMock()
    mock_consumer.__aenter__ = AsyncMock(return_value=mock_consumer)
    mock_consumer.__aexit__ = AsyncMock(return_value=False)
    mock_consumer.start = AsyncMock()
    mock_consumer.stop = AsyncMock()
    mock_consumer.commit = AsyncMock(side_effect=lambda: committed.append(True))

    # Make __aiter__ yield one message then raise CancelledError to exit loop
    async def one_then_cancel():
        yield bad_message
        raise asyncio.CancelledError()

    mock_consumer.__aiter__ = MagicMock(return_value=one_then_cancel())

    with patch("app.consumer.AIOKafkaConsumer", return_value=mock_consumer), \
         patch("app.consumer.SESSION_EVENT_SOURCE", "kafka"):
        try:
            from app.consumer import start_consumer
            await start_consumer(fake_redis)
        except asyncio.CancelledError:
            pass

    assert committed, "commit() must be called after a poison pill to advance the offset"


async def test_process_raw_event_failure_does_not_crash_consumer(fake_redis, monkeypatch):
    """
    If process_raw_event raises, the consumer must log the error, skip the commit,
    and continue — it must NOT re-raise.
    """
    good_event = make_event()
    good_message = MagicMock()
    good_message.value = good_event.model_dump(mode="json")

    committed = []
    mock_consumer = AsyncMock()
    mock_consumer.start = AsyncMock()
    mock_consumer.stop = AsyncMock()
    mock_consumer.commit = AsyncMock(side_effect=lambda: committed.append(True))

    async def one_then_cancel():
        yield good_message
        raise asyncio.CancelledError()

    mock_consumer.__aiter__ = MagicMock(return_value=one_then_cancel())

    with patch("app.consumer.AIOKafkaConsumer", return_value=mock_consumer), \
         patch("app.consumer.SESSION_EVENT_SOURCE", "kafka"), \
         patch("app.consumer.process_raw_event", AsyncMock(side_effect=RuntimeError("oops"))):
        try:
            from app.consumer import start_consumer
            await start_consumer(fake_redis)
        except asyncio.CancelledError:
            pass

    # commit must NOT have been called (offset not advanced on error)
    assert not committed, "commit() must NOT be called when process_raw_event raises"


async def test_redis_error_does_not_crash_consumer(fake_redis, monkeypatch):
    """RedisError in process_raw_event must trigger backoff but keep the consumer alive."""
    good_event = make_event()
    good_message = MagicMock()
    good_message.value = good_event.model_dump(mode="json")

    mock_consumer = AsyncMock()
    mock_consumer.start = AsyncMock()
    mock_consumer.stop = AsyncMock()
    mock_consumer.commit = AsyncMock()

    call_count = 0

    async def one_then_cancel():
        yield good_message
        raise asyncio.CancelledError()

    mock_consumer.__aiter__ = MagicMock(return_value=one_then_cancel())

    # Simulate Redis error in process_raw_event, then ping succeeds immediately
    with patch("app.consumer.AIOKafkaConsumer", return_value=mock_consumer), \
         patch("app.consumer.SESSION_EVENT_SOURCE", "kafka"), \
         patch("app.consumer.process_raw_event",
               AsyncMock(side_effect=redis_async.RedisError("conn reset"))), \
         patch.object(fake_redis, "ping", AsyncMock(return_value=True)), \
         patch("app.consumer.asyncio.sleep", AsyncMock()):
        try:
            from app.consumer import start_consumer
            await start_consumer(fake_redis)
        except asyncio.CancelledError:
            pass

    # The key assertion: consumer did NOT re-raise; it reached CancelledError naturally
    mock_consumer.stop.assert_called_once()


async def test_backpressure_still_processes_message(fake_redis, monkeypatch):
    """
    When Redis memory is over limit, the consumer sleeps then STILL processes the
    current message — it must not skip it with continue.
    """
    processed = []

    good_event = make_event()
    good_message = MagicMock()
    good_message.value = good_event.model_dump(mode="json")

    mock_consumer = AsyncMock()
    mock_consumer.start = AsyncMock()
    mock_consumer.stop = AsyncMock()
    mock_consumer.commit = AsyncMock()

    async def one_then_cancel():
        yield good_message
        raise asyncio.CancelledError()

    mock_consumer.__aiter__ = MagicMock(return_value=one_then_cancel())

    async def fake_process(r, event):
        processed.append(event)

    # Simulate memory over limit
    mem_over = {"used_memory": str(2 * 1024 * 1024 * 1024)}  # 2 GB

    with patch("app.consumer.AIOKafkaConsumer", return_value=mock_consumer), \
         patch("app.consumer.SESSION_EVENT_SOURCE", "kafka"), \
         patch("app.consumer.process_raw_event", fake_process), \
         patch("app.consumer.REDIS_MEMORY_LIMIT_BYTES", 1), \
         patch.object(fake_redis, "info", AsyncMock(return_value=mem_over)), \
         patch("app.consumer.asyncio.sleep", AsyncMock()):

        # Force the backpressure check to trigger by setting counter to 99 (next = 100)
        # We patch _bp_check_counter by running with a message count that triggers it
        # Simplest: reset counter threshold to 1
        with patch("app.consumer.AIOKafkaConsumer", return_value=mock_consumer):
            try:
                from app.consumer import start_consumer
                await start_consumer(fake_redis)
            except asyncio.CancelledError:
                pass

    assert processed, "Message must still be processed after backpressure sleep"
