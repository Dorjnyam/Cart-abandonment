"""
Shared pytest fixtures.

All fixtures that touch I/O (DB, Kafka, Redis, session forwarder) are mocked
so tests run without any running infrastructure.
"""

import os

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport


# Ensure no allowlist is active during tests (prefix-only check)
os.environ.setdefault("OBSERVER_API_KEYS", "")
os.environ.setdefault("OBSERVER_ADMIN_KEY", "test-admin-key")
os.environ.setdefault("DATABASE_URL", "postgresql://postgres:test@localhost:5432/test")


@pytest.fixture(autouse=True)
def clear_allowlist_cache():
    """Clear lru_cache on the allowlist so env changes in tests take effect."""
    from observer.api_key_allowlist import reload_allowlist_cache
    reload_allowlist_cache()
    yield
    reload_allowlist_cache()


@pytest.fixture(autouse=True)
def mock_db(monkeypatch):
    monkeypatch.setattr("observer.database.save_event", AsyncMock(return_value=42))
    mock_pool = MagicMock()
    mock_conn = AsyncMock()
    mock_conn.fetchval = AsyncMock(return_value=1)
    mock_pool.acquire.return_value.__aenter__ = AsyncMock(return_value=mock_conn)
    mock_pool.acquire.return_value.__aexit__ = AsyncMock(return_value=False)
    monkeypatch.setattr("observer.database._pool", mock_pool)
    monkeypatch.setattr("observer.database.get_pool", AsyncMock(return_value=mock_pool))
    monkeypatch.setattr("observer.database.init_db", AsyncMock())


@pytest.fixture(autouse=True)
def mock_kafka(monkeypatch):
    monkeypatch.setattr("observer.kafka_producer._producer", None)


@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    monkeypatch.setattr("observer.redis_queue.push_to_redis", AsyncMock())
    monkeypatch.setattr("observer.redis_queue._redis", None)


@pytest.fixture(autouse=True)
def mock_session_forwarder(monkeypatch):
    monkeypatch.setattr("observer.session_service_forwarder._client", None)
    monkeypatch.setattr("observer.session_service_forwarder._url", "")


@pytest_asyncio.fixture
async def client():
    from observer.main import app
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://testserver"
    ) as c:
        yield c


# Convenience fixtures for test data

T3_KEY = "tk_basic_testkey123"
T2_KEY = "tk_smart_testkey123"
T1_KEY = "tk_full_testkey123"

MINIMAL_EVENT = {
    "visitor_id": "vis_abc123",
    "session_id": "sess_abcdefgh",
    "event_type": "page_view",
    "url": "https://example.com/",
}
