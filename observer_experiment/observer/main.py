"""
Observer Experiment — FastAPI app (tiered API keys, ``observer/`` package).

Run: ``uvicorn observer.main:app --host 0.0.0.0 --port 8001``
"""

import asyncio
import html
import json
import logging
import os
import secrets
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from urllib.parse import quote

from dotenv import load_dotenv

# Load .env before any observer.* imports that read DATABASE_URL / REDIS_URL
_ENV_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ENV_ROOT / ".env")

# ── Structured JSON logging ──────────────────────────────────────────────────
try:
    try:
        from pythonjsonlogger.json import JsonFormatter as _JsonFmt  # pythonjsonlogger >= 3
    except ImportError:
        from pythonjsonlogger.jsonlogger import JsonFormatter as _JsonFmt  # pythonjsonlogger 2.x
    _handler = logging.StreamHandler()
    _handler.setFormatter(_JsonFmt("%(asctime)s %(name)s %(levelname)s %(message)s"))
    logging.root.handlers = [_handler]
    logging.root.setLevel(logging.INFO)
except ImportError:
    logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)

from fastapi import Body, FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError
from starlette.middleware.base import BaseHTTPMiddleware

from observer.database import (
    clear_events,
    get_events,
    get_field_analysis,
    get_pool,
    get_session_detail,
    get_stats,
    init_db,
    save_event,
)
from observer.api_key_allowlist import allowed_keys_count, allowlist_enabled
from observer.api_keys import generate_key, validate_key_string
from observer.middleware.auth import APIKeyAuthMiddleware, extract_api_key, resolve_tier_for_key
from observer.models.event import CORE_DB_KEYS, filter_payload_for_tier
from observer.models.field_catalog import build_field_catalog
from observer.models.payload import EventPayload
from observer.redis_queue import close_redis, push_to_redis, redis_push_enabled
from observer.kafka_producer import (
    TOPIC as KAFKA_TOPIC,
    kafka_enabled,
    publish as kafka_publish,
    start_kafka,
    stop_kafka,
)
from observer.session_service_forwarder import (
    forward_event as session_forward_event,
    session_forwarder_enabled,
    start_session_forwarder,
    stop_session_forwarder,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    redis_ok = await redis_push_enabled()
    kafka_bootstrap_set = bool(os.getenv("KAFKA_BOOTSTRAP_SERVERS", "").strip())
    kafka_ok = await start_kafka()
    session_fwd_ok = await start_session_forwarder()

    logger.info("Observer started — PostgreSQL (tiered keys)")
    logger.info("Health: GET /health | Ingest: POST /track | Viewer: /viewer")
    auth_msg = (
        f"allowlist ON ({allowed_keys_count()} key(s) in OBSERVER_API_KEYS)"
        if allowlist_enabled()
        else "allowlist OFF — any suffix after tk_* prefix is accepted"
    )
    logger.info("Auth: %s", auth_msg)
    logger.info(
        "Redis: %s | Kafka: %s | Session: %s",
        "ON" if redis_ok else "OFF",
        "ON" if kafka_ok else ("OFF (bootstrap set, broker unreachable)" if kafka_bootstrap_set else "OFF (KAFKA_BOOTSTRAP_SERVERS not set)"),
        "ON" if session_fwd_ok else "OFF",
    )

    try:
        yield
    finally:
        await close_redis()
        await stop_kafka()
        await stop_session_forwarder()
        # Access _pool directly — avoids creating a new pool just to close it if startup failed
        from observer import database as _db_module
        if _db_module._pool is not None:
            await _db_module._pool.close()
            _db_module._pool = None

app = FastAPI(
    title="Observer Experiment",
    description="Click-stream collection with API key tiers (T3/T2/T1)",
    version="2.0.0",
    lifespan=lifespan,
)


@app.exception_handler(Exception)
async def _global_exc_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled %s on %s %s",
        type(exc).__name__,
        request.method,
        request.url.path,
        exc_info=True,
    )
    return JSONResponse({"detail": "Internal server error"}, status_code=500)


_CORS_ORIGINS = [
    o.strip()
    for o in os.getenv("OBSERVER_CORS_ORIGINS", "").split(",")
    if o.strip()
]


class _MaxBodyMiddleware(BaseHTTPMiddleware):
    """Reject requests whose Content-Length exceeds 64 KB before reading the body."""
    _LIMIT = 64 * 1024

    async def dispatch(self, request: Request, call_next):
        cl = request.headers.get("content-length")
        if cl and int(cl) > self._LIMIT:
            return JSONResponse({"detail": "Payload too large"}, status_code=413)
        return await call_next(request)


app.add_middleware(_MaxBodyMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_methods=["POST", "GET", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "X-API-Key", "Authorization"],
)
app.add_middleware(APIKeyAuthMiddleware)

_ROOT = Path(__file__).resolve().parent.parent
_SNIPPET_DIR = Path(__file__).resolve().parent / "snippet"


def _require_admin(request: Request) -> None:
    """Raise 503/403 unless a valid X-Admin-Key header is present."""
    admin_key = os.getenv("OBSERVER_ADMIN_KEY", "").strip()
    if not admin_key:
        raise HTTPException(
            status_code=503,
            detail="Admin endpoints disabled — set OBSERVER_ADMIN_KEY in .env to enable",
        )
    provided = request.headers.get("X-Admin-Key", "")
    if not provided or not secrets.compare_digest(provided, admin_key):
        raise HTTPException(status_code=403, detail="Invalid or missing X-Admin-Key header")


@app.get("/health")
async def health():
    """Readiness probe — checks PostgreSQL, Kafka, and Redis. Returns 503 if any check fails."""
    # PostgreSQL
    pg_ok = False
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        pg_ok = True
    except Exception as exc:
        logger.warning("Health check: PostgreSQL failed: %s", exc)

    # Kafka — producer is up only when kafka_enabled() is True
    kafka_ok = kafka_enabled()

    # Redis — redis_push_enabled() returns True only when connected
    redis_ok = await redis_push_enabled()

    # PostgreSQL is the only required dependency.
    # Kafka and Redis are optional fan-outs — their absence must not fail the health check.
    overall = "ok" if pg_ok else "degraded"
    body = {
        "status": overall,
        "postgres": pg_ok,
        "kafka": kafka_ok,
        "redis": redis_ok,
    }
    if overall != "ok":
        return JSONResponse(body, status_code=503)
    return body


@app.get("/ready")
async def ready():
    """Deep readiness — reports all dependency states. Returns 207 if any optional dep is degraded."""
    pg_ok = False
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        pg_ok = True
    except Exception as exc:
        logger.warning("Ready check: PostgreSQL failed: %s", exc)

    kafka_ok = kafka_enabled()
    redis_ok = await redis_push_enabled()

    degraded = [k for k, v in {"postgres": pg_ok, "kafka": kafka_ok, "redis": redis_ok}.items() if not v]
    return JSONResponse(
        {
            "status": "ok" if not degraded else "degraded",
            "postgres": pg_ok,
            "kafka": kafka_ok,
            "redis": redis_ok,
            "degraded": degraded,
        },
        status_code=207 if degraded else 200,
    )


async def _bg_kafka(event: dict, event_id: int) -> None:
    """Background task: publish to Kafka after response is sent. Never raises."""
    if not await kafka_publish(event):
        logger.warning("Kafka publish failed for event_id=%s", event_id)


async def _bg_forward(event: dict, event_id: int) -> None:
    """Background task: forward to Session Service after response is sent. Never raises."""
    if not await session_forward_event(event):
        logger.warning("Session forward failed for event_id=%s", event_id)


async def _ingest(request: Request):
    try:
        data = await request.json()
        if not isinstance(data, dict):
            data = {}
    except Exception:
        raise HTTPException(status_code=400, detail="Request body must be valid JSON")

    key = extract_api_key(request, data)
    tier = resolve_tier_for_key(key)
    if not tier:
        # API key буруу бол DB write хийхээс өмнө тасална.
        # Ингэснээр tenant/org mapping тодорхойгүй raw event хадгалагдахгүй.
        raise HTTPException(
            status_code=401,
            detail=(
                "Missing or invalid API key. Use prefix tk_basic_, tk_smart_, or tk_full_. "
                "If OBSERVER_API_KEYS is set, the full key string must match one entry exactly."
            ),
        )

    data.pop("api_key", None)

    data["ip"] = request.client.host if request.client else "unknown"
    data["user_agent"] = request.headers.get("user-agent", "")
    data["tier"] = tier  # injected so EventPayload.normalise_and_filter can apply allowlist

    try:
        payload_obj = EventPayload(**data)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc
    filtered = payload_obj.to_ingest_dict()
    filtered.pop("tier", None)  # tier is passed as a dedicated column, not stored in payload

    # Алхам 1: raw_events PostgreSQL хүснэгт нь анхны evidence store.
    # Энэ write амжилттай болсны дараа Kafka/Redis fan-out хийдэг.
    event_id = await save_event(filtered, tier=tier)

    # Алхам 2: Redis queue нь local түр дамжуулалт тул response-оос өмнө хурдан хийгдэнэ.
    await push_to_redis(filtered, tier)

    # Алхам 3/4: raw event-г Kafka raw_events topic болон Session service рүү дамжуулна.
    # Fire-and-forget тул Kafka latency хэрэглэгчийн track request-г удаашруулахгүй.
    event_out = {**filtered, "event_id": event_id, "tier": tier}
    if kafka_enabled():
        asyncio.create_task(_bg_kafka(event_out, event_id))
    if session_forwarder_enabled():
        asyncio.create_task(_bg_forward(event_out, event_id))

    payload_keys = [k for k in filtered if k not in CORE_DB_KEYS]
    return {
        "status": "ok",
        "id": event_id,
        "tier": tier,
        "received_fields": list(filtered.keys()),
        "payload_field_count": len(payload_keys),
    }


@app.post("/track")
@app.post("/events")
@app.post("/collect")
async def ingest(request: Request):
    """Ingest: validate → DB insert → Kafka/HTTP fan-out (``/track`` and ``/collect`` are aliases)."""
    return await _ingest(request)


@app.get("/api/keys/validate")
async def api_validate_key_get(key: str = ""):
    """Return whether ``key`` has a valid tier prefix (same rules as ``/track``)."""
    return validate_key_string(key)


@app.post("/api/keys/validate")
async def api_validate_key_post(body: dict = Body(default_factory=dict)):
    k = None
    if isinstance(body, dict):
        k = body.get("key")
        if k is None:
            k = body.get("api_key")
    return validate_key_string(k if isinstance(k, str) else None)


@app.post("/api/keys/generate")
async def api_generate_key(body: dict = Body(default_factory=dict)):
    """
    Generate a random suffix after the tier prefix. Keys are not stored; safe for local/dev use.
    """
    tier = None
    if isinstance(body, dict):
        tier = body.get("tier")
    try:
        full, t = generate_key(str(tier) if tier is not None else "")
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="tier must be T1, T2, or T3 (or basic / smart / full)",
        ) from None
    note = (
        "Add this exact string to OBSERVER_API_KEYS in the server environment and restart."
        if allowlist_enabled()
        else "Optional: set OBSERVER_API_KEYS so only registered keys work (suffix edits will fail)."
    )
    return {
        "key": full,
        "tier": t,
        "prefix_help": "tk_basic_=T3, tk_smart_=T2, tk_full_=T1",
        "allowlist_enabled": allowlist_enabled(),
        "note": note,
    }


@app.get("/api/keys/status")
async def api_keys_status():
    """Whether full-key allowlist is active (no secrets returned)."""
    return {
        "allowlist_enabled": allowlist_enabled(),
        "allowed_keys_count": allowed_keys_count(),
    }


@app.get("/api/field-catalog")
async def api_field_catalog():
    """
    Payload-field reference for Viewer and Docusaurus: tier, research sector,
    provenance, short Mongolian labels (derived from ``observer/models/event.py`` allowlists).
    """
    return build_field_catalog()


@app.get("/viewer", response_class=HTMLResponse)
async def viewer():
    html_path = _ROOT / "viewer.html"
    if html_path.exists():
        content = await asyncio.to_thread(html_path.read_text, encoding="utf-8")
        return HTMLResponse(content)
    return HTMLResponse("<h1>viewer.html not found</h1>")


@app.get("/snippet-test", response_class=HTMLResponse)
async def snippet_test(key: str = "tk_basic_localtest"):
    """
    Same-origin test page: loads ``track.js`` and sends ``page_view``.
    Open ``http://localhost:8001/snippet-test`` — if events appear in ``/viewer``, Observer + DB + key are OK; problems are only in Next.js / env.

    If ``OBSERVER_API_KEYS`` allowlist is on, pass your full key: ``/snippet-test?key=tk_smart_....``
    """
    k = (key or "").strip()
    if not (
        k.startswith("tk_basic_")
        or k.startswith("tk_smart_")
        or k.startswith("tk_full_")
    ):
        k = "tk_basic_localtest"
    qk = quote(k, safe="")
    page = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Observer snippet test</title>
  <style>body{{font-family:system-ui,sans-serif;max-width:42rem;margin:2rem;line-height:1.5}}</style>
</head>
<body>
  <h1>Observer snippet test</h1>
  <p>This page only talks to <strong>this</strong> server (no Next.js).</p>
  <ol>
    <li>Open DevTools → <strong>Network</strong> → filter <code>track</code> → you should see <strong>200</strong>.</li>
    <li>Open <a href="/viewer">/viewer</a> → you should see a new <code>page_view</code> event.</li>
  </ol>
  <p>Key in use: <code>{html.escape(k)}</code>
     (if allowlist is on, use <code>?key=your_exact_key</code> in the URL)</p>
  <script>
    window.__OBSERVER_BASE__ = location.origin;
    window.__OBSERVER_API_KEY__ = {json.dumps(k)};
    window.__OBSERVER_DEBUG__ = true;
  </script>
  <script src="/static/snippet/track.js?key={qk}"></script>
</body>
</html>"""
    return HTMLResponse(page)


@app.get("/events")
async def events(
    limit: int = Query(default=100, ge=1, le=10_000),
    event_type: str = None,
    session_id: str = None,
):
    rows = await get_events(limit=limit, event_type=event_type, session_id=session_id)
    return {"count": len(rows), "events": rows}


@app.get("/stats")
async def stats():
    return await get_stats()


@app.get("/session/{session_id}")
async def session_detail(session_id: str):
    events_list = await get_session_detail(session_id)

    if not events_list:
        return {"error": "Session not found", "session_id": session_id}

    last = events_list[-1]
    lp = last.get("payload", {}) or {}

    duration_sec = None
    if len(events_list) >= 2:
        try:
            def parse_dt(s):
                try:
                    return datetime.fromisoformat(s)
                except Exception:
                    return None

            t1 = parse_dt(events_list[0]["created_at"])
            t2 = parse_dt(events_list[-1]["created_at"])
            if t1 and t2:
                duration_sec = int((t2 - t1).total_seconds())
        except Exception as exc:
            logger.warning("session_detail: duration calc failed for session_id=%s: %s", session_id, exc)

    return {
        "session_id": session_id,
        "event_count": len(events_list),
        "event_types": list(set(e["event_type"] for e in events_list)),
        "duration_sec": duration_sec,
        "visit_count": lp.get("visit_count"),
        "device": lp.get("device_type"),
        "max_scroll_pct": lp.get("max_scroll_pct"),
        "click_count": lp.get("click_count"),
        "tab_switches": lp.get("tab_hidden_count"),
        "cart_adds": lp.get("cart_add_count"),
        "events": events_list,
    }


@app.get("/fields")
async def field_analysis():
    return await get_field_analysis()


@app.get("/visitor/{visitor_id}")
async def visitor_history(visitor_id: str):
    pool = await get_pool()
    async with pool.acquire() as conn:
        sessions = await conn.fetch(
            """
            SELECT
                session_id,
                MIN(created_at) as start_time,
                MAX(created_at) as end_time,
                COUNT(*) as event_count,
                ARRAY_AGG(DISTINCT event_type) as event_types,
                MAX(CASE WHEN payload->>'max_scroll_pct' ~ '^-?[0-9]+(\\.[0-9]+)?$'
                    THEN (payload->>'max_scroll_pct')::float ELSE NULL END) as max_scroll,
                MAX(CASE WHEN payload->>'click_count' ~ '^[0-9]+$'
                    THEN (payload->>'click_count')::int ELSE NULL END) as clicks,
                MAX(CASE WHEN payload->>'visit_count' ~ '^[0-9]+$'
                    THEN (payload->>'visit_count')::int ELSE NULL END) as visit_number,
                MAX(payload->>'device_type') as device
            FROM raw_events
            WHERE visitor_id = $1
            GROUP BY session_id
            ORDER BY start_time DESC
            """,
            visitor_id,
        )

        return {
            "visitor_id": visitor_id,
            "session_count": len(sessions),
            "sessions": [
                {
                    "session_id": r["session_id"],
                    "start": r["start_time"].isoformat() if r["start_time"] else None,
                    "end": r["end_time"].isoformat() if r["end_time"] else None,
                    "event_count": r["event_count"],
                    "event_types": list(r["event_types"] or []),
                    "max_scroll": r["max_scroll"],
                    "clicks": r["clicks"],
                    "visit_number": r["visit_number"],
                    "device": r["device"],
                }
                for r in sessions
            ],
        }


@app.post("/query")
async def raw_query(request: Request):
    _require_admin(request)
    body = await request.json()
    sql = body.get("sql", "").strip()

    if not sql.upper().startswith("SELECT"):
        return JSONResponse({"error": "Only SELECT is allowed"}, 400)

    pool = await get_pool()
    async with pool.acquire() as conn:
        try:
            # 10-second cap prevents SELECT pg_sleep(3600) or runaway aggregations
            await conn.execute("SET LOCAL statement_timeout = '10s'")
            rows = await conn.fetch(sql)
            result = []
            for r in rows:
                row = dict(r)
                for k, v in row.items():
                    if hasattr(v, "isoformat"):
                        row[k] = v.isoformat()
                result.append(row)
            return {"count": len(result), "rows": result}
        except Exception as e:
            return JSONResponse({"error": str(e)}, 400)


@app.delete("/clear")
async def clear(request: Request):
    _require_admin(request)
    count = await clear_events()
    return {"deleted": count, "status": "cleared"}


# Mount static files last so API routes (/api/*, /stats, …) are not shadowed.
app.mount("/static/snippet", StaticFiles(directory=str(_SNIPPET_DIR)), name="snippet_static")
app.mount("/static", StaticFiles(directory=str(_ROOT)), name="static_root")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "observer.main:app",
        host="0.0.0.0",
        port=8001,
        loop="uvloop",
        reload=False,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
