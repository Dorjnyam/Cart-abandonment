"""
Integration tests for the ingest endpoints (/track, /events, /collect).

All infrastructure (PostgreSQL, Kafka, Redis) is mocked in conftest.py.
"""

import pytest
import pytest_asyncio
from unittest.mock import AsyncMock

from tests.conftest import MINIMAL_EVENT, T1_KEY, T2_KEY, T3_KEY


pytestmark = pytest.mark.asyncio


# ── Happy path ─────────────────────────────────────────────────────────────

async def test_t3_event_returns_200(client):
    resp = await client.post(
        "/track",
        json={**MINIMAL_EVENT, "api_key": T3_KEY},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["tier"] == "T3"
    assert "id" in body


async def test_t2_event_returns_200(client):
    resp = await client.post(
        "/track",
        json={**MINIMAL_EVENT, "api_key": T2_KEY, "js_error": 1},
    )
    assert resp.status_code == 200
    assert resp.json()["tier"] == "T2"


async def test_t1_event_returns_200(client):
    resp = await client.post(
        "/track",
        json={**MINIMAL_EVENT, "api_key": T1_KEY, "cart_value": 99.99},
    )
    assert resp.status_code == 200
    assert resp.json()["tier"] == "T1"


async def test_api_key_via_header(client):
    resp = await client.post(
        "/track",
        headers={"X-API-Key": T3_KEY},
        json=MINIMAL_EVENT,
    )
    assert resp.status_code == 200
    assert resp.json()["tier"] == "T3"


async def test_collect_alias_works(client):
    resp = await client.post(
        "/collect",
        json={**MINIMAL_EVENT, "api_key": T3_KEY},
    )
    assert resp.status_code == 200


async def test_events_alias_works(client):
    resp = await client.post(
        "/events",
        json={**MINIMAL_EVENT, "api_key": T3_KEY},
    )
    assert resp.status_code == 200


# ── Auth failures ──────────────────────────────────────────────────────────

async def test_missing_api_key_returns_401(client):
    resp = await client.post("/track", json=MINIMAL_EVENT)
    assert resp.status_code == 401


async def test_invalid_prefix_returns_401(client):
    resp = await client.post(
        "/track",
        json={**MINIMAL_EVENT, "api_key": "invalid_key_abc"},
    )
    assert resp.status_code == 401


async def test_empty_api_key_returns_401(client):
    resp = await client.post(
        "/track",
        headers={"X-API-Key": ""},
        json=MINIMAL_EVENT,
    )
    assert resp.status_code == 401


# ── Payload validation ─────────────────────────────────────────────────────

async def test_invalid_json_returns_400(client):
    resp = await client.post(
        "/track",
        headers={"X-API-Key": T3_KEY, "Content-Type": "application/json"},
        content=b"not json",
    )
    assert resp.status_code == 400


async def test_body_too_large_returns_413(client):
    big_payload = {"api_key": T3_KEY, "data": "x" * (65 * 1024)}
    import json
    raw = json.dumps(big_payload).encode()
    resp = await client.post(
        "/track",
        headers={"Content-Type": "application/json", "Content-Length": str(len(raw))},
        content=raw,
    )
    assert resp.status_code == 413


# ── event_id idempotency ───────────────────────────────────────────────────

async def test_event_id_is_forwarded_to_save_event(client, monkeypatch):
    """event_id must not be stripped by tier filter — idempotency depends on it."""
    import observer.main as main_mod

    saved_args = {}

    async def capture_save_event(data, tier=None):
        saved_args.update(data)
        saved_args["_tier"] = tier
        return 99

    monkeypatch.setattr(main_mod, "save_event", capture_save_event)

    resp = await client.post(
        "/track",
        json={
            **MINIMAL_EVENT,
            "api_key": T3_KEY,
            "event_id": "evt_unique_abc123",
        },
    )
    assert resp.status_code == 200
    assert saved_args.get("event_id") == "evt_unique_abc123", (
        "event_id was stripped by tier filter — check CORE_DB_KEYS"
    )


# ── Tier allowlist filtering ───────────────────────────────────────────────

async def test_t3_cannot_send_t1_only_field(client, monkeypatch):
    """T3 key must not persist cart_value (a T1-only field)."""
    import observer.database as db

    saved_args = {}

    async def capture_save_event(data, tier=None):
        saved_args.update(data)
        return 1

    monkeypatch.setattr(db, "save_event", capture_save_event)

    resp = await client.post(
        "/track",
        json={**MINIMAL_EVENT, "api_key": T3_KEY, "cart_value": 49.99},
    )
    assert resp.status_code == 200
    # cart_value must be stripped from the persisted payload for T3
    assert "cart_value" not in saved_args


async def test_forbidden_keys_are_stripped(client, monkeypatch):
    import observer.database as db

    saved_args = {}

    async def capture_save_event(data, tier=None):
        saved_args.update(data)
        return 1

    monkeypatch.setattr(db, "save_event", capture_save_event)

    resp = await client.post(
        "/track",
        json={
            **MINIMAL_EVENT,
            "api_key": T3_KEY,
            "password": "secret",
            "token": "jwt_abc",
        },
    )
    assert resp.status_code == 200
    assert "password" not in saved_args
    assert "token" not in saved_args


# ── Kafka down doesn't break ingest ───────────────────────────────────────

async def test_kafka_disabled_still_returns_200(client, monkeypatch):
    """_producer is None → kafka_enabled() is False → create_task skipped → still 200."""
    monkeypatch.setattr("observer.kafka_producer._producer", None)
    resp = await client.post(
        "/track",
        json={**MINIMAL_EVENT, "api_key": T3_KEY},
    )
    assert resp.status_code == 200


# ── Health endpoints ───────────────────────────────────────────────────────

async def test_health_ok_when_postgres_ok(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"
    assert resp.json()["postgres"] is True


async def test_health_ok_when_kafka_is_off(client):
    """Kafka disabled must not degrade /health (optional dependency)."""
    resp = await client.get("/health")
    body = resp.json()
    assert resp.status_code == 200, f"/health returned {resp.status_code}: {body}"
    assert body["status"] == "ok"


async def test_health_503_when_postgres_down(client, monkeypatch):
    import observer.main as main_mod
    monkeypatch.setattr(main_mod, "get_pool", AsyncMock(side_effect=Exception("DB down")))
    resp = await client.get("/health")
    assert resp.status_code == 503
    assert resp.json()["status"] == "degraded"


async def test_ready_endpoint_returns_status(client):
    resp = await client.get("/ready")
    assert resp.status_code in (200, 207)
    body = resp.json()
    assert "status" in body
    assert "postgres" in body


# ── GET /events bound ─────────────────────────────────────────────────────

async def test_get_events_rejects_overlimit(client, monkeypatch):
    import observer.database as db
    monkeypatch.setattr(db, "get_events", AsyncMock(return_value=[]))
    resp = await client.get("/events?limit=100000")
    assert resp.status_code == 422
