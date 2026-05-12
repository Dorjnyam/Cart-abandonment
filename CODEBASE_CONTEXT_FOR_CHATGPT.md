# Codebase Context For ChatGPT

Generated from local repository inspection on 2026-05-08.

Security note: this report lists environment variable names only. API keys, passwords, tokens, database URLs, and credential values are redacted or omitted.

## 1. Repository Overview

### Top-Level Structure

```text
.
├── cart_analytic/                 # Analytics dashboard frontend
├── cart-analytics-docusaurus/     # Documentation site
├── data/                          # Synthetic/session CSV data
├── docs/                          # Contracts, audit evidence, cleanup notes
├── feature/feature_svc/           # Feature engineering service
├── main_service/                  # Django API/main backend
├── ml/                            # ML prediction service and model artifacts
├── observer_experiment/           # Observer/event collector service
├── scripts/                       # Audit and E2E scripts
├── session/session/               # Sessionization service
├── sneaker-store/                 # Demo ecommerce storefront
├── docker-compose.yml
├── .env.example
└── README.md
```

### Main Services / Modules

| Service | Folder | Language / framework | Purpose | Main entry file | Dockerfile | Important dependencies |
|---|---|---|---|---|---|---|
| Main API | `main_service` | Python, Django 5, DRF | Auth, tenant/team/API key management, dashboard APIs, diagnosis/recommendation storage, prediction consumer | `manage.py`, `main_service/urls.py`, `main_service/wsgi.py` | Yes | Django, DRF, SimpleJWT, Celery, Redis, psycopg, kafka-python, DuckDB, boto3, google-genai, gunicorn |
| Observer | `observer_experiment` | Python, FastAPI | Browser event ingestion, API key tier filtering, raw event storage, Kafka/Redis/session fan-out | `observer/main.py` | Yes | FastAPI, uvicorn, asyncpg, aiokafka, redis, pydantic-settings |
| Session service | `session/session` | Python, FastAPI, Celery | Sessionize raw events with Redis, emit enriched sessions | `app/main.py`, `celery_app.py` | Yes | FastAPI, aiokafka, redis, asyncpg, celery, fakeredis for tests |
| Feature service | `feature/feature_svc` | Python, FastAPI | Convert enriched sessions into ML feature vectors | `main.py` | Yes | FastAPI, aiokafka, pandas, numpy, asyncpg, pydantic |
| ML service | `ml` | Python, FastAPI | XGBoost prediction, SHAP top features, Kafka prediction output | `app/main.py`, `app/pipeline.py` | Yes | FastAPI, aiokafka, xgboost, shap, scikit-learn, torch, pandas, minio |
| Analytics dashboard | `cart_analytic` | TypeScript, Next.js, React | Dashboard UI for analytics, sessions, diagnosis, recommendations, settings, snippet install | `src/app/layout.tsx`, `src/app/*/page.tsx` | Yes | Next 16, React 19, Recharts, lucide-react, Tailwind |
| Demo ecommerce | `sneaker-store` | TypeScript, Next.js, Prisma, NextAuth | Demo storefront that loads Observer snippet and produces ecommerce events | `src/app/layout.tsx`, `src/app/*` | Yes | Next 16, Prisma, NextAuth, bcrypt, Zustand, zod |
| VG service | `main_service/vg_service` | Python, Flask | Visibility Graph entropy/motif calculation | `server.py` | NOT FOUND in compose | Flask code exists, not listed in root requirements/Docker Compose |
| Documentation | `cart-analytics-docusaurus/cart-analytics-docs` | Docusaurus | Thesis/project documentation | `docusaurus.config.ts` | NOT FOUND | Docusaurus packages |

## 2. Docker And Runtime Environment

### Docker Compose Services

`docker-compose.yml` defines these services:

| Service | Image/build | Port(s) | Depends on | Configured role |
|---|---|---:|---|---|
| `postgres` | `postgres:16-alpine` | `5432` | none | PostgreSQL database |
| `redis` | `redis:7-alpine` | `6379` | none | Redis cache/session/Celery broker |
| `kafka` | `apache/kafka:3.7.1` | `9092` | none | Kafka broker in KRaft mode |
| `kafka-init` | `apache/kafka:3.7.1` | none | `kafka` healthy | Creates Kafka topics |
| `main_service` | build `./main_service` | `8000` | `postgres`, `redis` | Django API; migrates and seeds demo tenant on start |
| `main_prediction_consumer` | build `./main_service` | none | `main_service`, `kafka`, `kafka-init` | Consumes `prediction_done` |
| `observer` | build `./observer_experiment` | `8001` | `postgres`, `redis`, `kafka`, `kafka-init` | Event collector |
| `session_service` | build `./session`, Dockerfile `session/Dockerfile` | `8002` | `postgres`, `redis`, `kafka`, `kafka-init` | Sessionizer API/consumer |
| `session_celery` | same as session | none | `redis`, `kafka`, `kafka-init` | Celery window snapshot worker |
| `feature_service` | build `./feature/feature_svc` | `8003` | `kafka`, `kafka-init` | Feature vector Kafka processor |
| `ml_service` | build `./ml` | `8004` | `postgres`, `kafka`, `kafka-init` | ML Kafka processor and prediction API |
| `analytics_dashboard` | build `./cart_analytic` | `3001` | `main_service` | Dashboard frontend |
| `demo_ecommerce` | build `./sneaker-store` | `3000` | `postgres`, `observer` | Demo shop frontend/backend |

### Kafka Topics Created

`kafka-init` creates:

- `raw_events`
- `session_enriched`
- `feature_ready`
- `prediction_done`
- `prediction_done_v2`

Additional DLQ names appear in code/config but are not explicitly created by `kafka-init`:

- `prediction_dlq`
- `prediction_done_dlq`

Kafka has `KAFKA_AUTO_CREATE_TOPICS_ENABLE=true`, so these may be auto-created when used.

### Volumes / Network

- Volumes: `pg_data`, `duckdb_data`
- Bind mount: `./ml/models:/app/models`
- Network: default Compose network (`codebase_default` when project name is `codebase`)

### Environment Variables By Name Only

| Service | Environment variable names |
|---|---|
| `postgres` | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `PGCTLTIMEOUT` |
| `kafka` | `KAFKA_NODE_ID`, `KAFKA_PROCESS_ROLES`, `KAFKA_CONTROLLER_LISTENER_NAMES`, `KAFKA_LISTENERS`, `KAFKA_ADVERTISED_LISTENERS`, `KAFKA_LISTENER_SECURITY_PROTOCOL_MAP`, `KAFKA_CONTROLLER_QUORUM_VOTERS`, `KAFKA_INTER_BROKER_LISTENER_NAME`, `KAFKA_AUTO_CREATE_TOPICS_ENABLE`, `KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR`, `KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR`, `KAFKA_TRANSACTION_STATE_LOG_MIN_ISR`, `KAFKA_GROUP_INITIAL_REBALANCE_DELAY_MS` |
| `main_service` / `main_prediction_consumer` | `DJANGO_DEBUG`, `DJANGO_SECRET_KEY`, `ALLOWED_HOSTS`, `FRONTEND_URL`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_PREDICTION_DONE_TOPIC`, `KAFKA_CONSUMER_GROUP`, `KAFKA_AUTO_OFFSET_RESET`, `DEMO_TENANT_EXTERNAL_ID`, `DEMO_TENANT_NAME`, `DEMO_TENANT_DOMAIN`, `DEMO_ADMIN_EMAIL`, `DEMO_ADMIN_PASSWORD`, `DEMO_OBSERVER_API_KEY`, `GEMINI_API_KEY`, `DUCKDB_PATH` |
| `observer` | `DATABASE_URL`, `KAFKA_BOOTSTRAP_SERVERS`, `REDIS_URL`, `SESSION_SERVICE_URL`, `OBSERVER_CORS_ORIGINS`, `OBSERVER_API_KEYS` |
| `session_service` / `session_celery` | `KAFKA_BOOTSTRAP`, `KAFKA_BOOTSTRAP_SERVERS`, `RAW_EVENTS_TOPIC`, `SESSION_ENRICHED_TOPIC`, `SESSION_CONSUMER_GROUP`, `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`, `PG_DSN`, `SESSION_DEFAULT_TENANT_ID`, `SESSION_EVENT_SOURCE`, `SESSION_DEDUPE_EVENT_ID`, `SESSION_WINDOWS`, `SESSION_TTL_SECONDS` |
| `feature_service` | `KAFKA_BOOTSTRAP`, `SESSION_ENRICHED_TOPIC`, `FEATURE_READY_TOPIC`, `FEATURE_CONSUMER_GROUP`, `FEATURE_SET`, `FEATURE_VERSION`, `FEATURE_VARIANT`, `LOG_LEVEL`, `PORT` |
| `ml_service` | `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_INPUT_TOPIC`, `KAFKA_OUTPUT_TOPIC`, `KAFKA_CONSUMER_GROUP`, `PG_DSN`, `MODEL_PATH_XGBOOST`, `MODEL_VERSION_XGBOOST`, `ABANDON_THRESHOLD`, `SHAP_ENABLED` |
| `analytics_dashboard` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_AUTH_MODE`, `NEXT_PUBLIC_MOCK_FALLBACK` |
| `demo_ecommerce` | `DATABASE_URL`, `POSTGRES_ADMIN_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_OBSERVER_URL`, `NEXT_PUBLIC_OBSERVER_SNIPPET_KEY` |

### Runtime Commands

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

`docker compose config --quiet` was run during this report generation and exited successfully.

### Configuration Status

| Component | Status |
|---|---|
| Kafka | Configured in Compose; topics initialized by `kafka-init` |
| Redis | Configured in Compose; used by Observer, Session, Main/Celery |
| PostgreSQL | Configured in Compose; used by Main, Observer, Session, ML, demo shop |
| Dashboard frontend | Configured as `analytics_dashboard` on port `3001` |
| Demo storefront | Configured as `demo_ecommerce` on port `3000` |
| Backend services | Main, Observer, Session, Feature, ML configured |
| VG Flask service | PARTIALLY IMPLEMENTED; code exists but no root Docker Compose service |

## 3. Backend/API Services

### Main Django API (`main_service`)

Root URLs:

- `GET/POST /admin/` via Django admin
- `/api/` includes accounts, tenants, analytics
- `POST /track` and `POST /track/` legacy observer endpoint from `apps.diagnosis.observer_views.TrackEventView`
- Prometheus URLs at `/` if `django_prometheus` is installed

Authentication:

- DRF default authentication: JWT (`rest_framework_simplejwt.authentication.JWTAuthentication`)
- DRF default permission: `IsAuthenticated`
- Some auth endpoints explicitly allow anonymous access
- Tenant filtering uses `resolve_tenant_for_user()`, which requires an active `TeamMember` for the authenticated user

Swagger/OpenAPI:

- Django Swagger/OpenAPI tooling: NOT FOUND
- DRF browsable API may be available depending on DRF runtime settings, but no explicit schema package found.

#### Auth Endpoints

| Method | Path | Body visible in code | Response visible in code |
|---|---|---|---|
| `POST` | `/api/auth/register/` | `email`, `password`, `store_name`, `plan` | `201 {"message": ...}`; creates User, Tenant, owner TeamMember |
| `POST` | `/api/auth/login/` | `email` or `username`, `password` | JWT `access`, `refresh`, plus `user` object |
| `POST` | `/api/auth/logout/` | `refresh` | `205 {"detail": "logged out"}` |
| `POST` | `/api/auth/token/refresh/` | `refresh` | SimpleJWT refresh response |
| `POST` | `/api/auth/refresh/` | `refresh` | same view as token refresh |
| `POST` | `/api/auth/password/reset/` | `email` | success message regardless of account existence |
| `POST` | `/api/auth/password/reset/confirm/` | `uid`, `token`, `new_password1`, `new_password2` | success or validation errors |
| `POST` | `/api/auth/password/change/` | current/new password fields | success or validation errors |
| `GET/PATCH` | `/api/auth/profile/` | PATCH `full_name` | profile object with tenant data |

#### Tenant / API Key / Team Endpoints

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/admin/tenants/` | Staff/superuser only; creates tenant and owner membership |
| `POST` | `/api/tenant/apikey/generate/` | Owner/admin only; rotates/deactivates previous active keys and returns one-time raw key |
| `GET` | `/api/team/` | Lists tenant team if one tenant context resolves |
| `POST` | `/api/team/invite/` | Owner-only invite/assign user |
| `GET` | `/api/settings/api-keys/` | Lists masked API keys for resolved tenant |
| `POST` | `/api/settings/api-keys/` | Creates hashed API key and returns raw key once |
| `DELETE` | `/api/settings/api-keys/<id>/` | Soft-disables key |
| `GET/PATCH` | `/api/settings/store/` | Store settings; PATCH owner/admin only |
| `GET` | `/api/settings/team/` | Settings team list |
| `POST` | `/api/settings/team/invite/` | Owner invite |
| `DELETE` | `/api/settings/team/<id>/` | Owner/admin team removal |

API key storage:

- `apps.tenants.models.APIKey.generate_raw_key()` returns raw key plus SHA-256 digest.
- Django stores only `key_hash`, prefix, tier, and metadata.
- Raw key is returned only in create/generate responses.

#### Dashboard / Analytics / Diagnosis Endpoints

All are authenticated unless otherwise noted.

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/dashboard/overview/` | Dashboard summary, model info, top reason, trend, funnel, recent sessions |
| `GET` | `/api/dashboard/trends/` | Daily trend |
| `GET` | `/api/dashboard/reasons/` | S1-S7 reason summaries |
| `GET` | `/api/dashboard/sessions/` | Paginated dashboard sessions |
| `GET` | `/api/dashboard/sessions/<session_id>/` | Session detail, prediction, diagnosis, recommendation, events |
| `GET` | `/api/dashboard/recommendations/` | Structured recommendation cards and stats |
| `PATCH` | `/api/dashboard/recommendations/<id>/status/` | Body `status`: `new`, `in_progress`, `done`, `dismissed` |
| `GET` | `/api/dashboard/integration/` | Observer snippet, Kafka topics, demo URLs, last events |
| `GET` | `/api/analytics/overview/` | Legacy/alternate analytics overview |
| `GET` | `/api/analytics/scores/` | Latest S1-S7 scores |
| `GET` | `/api/analytics/history/` | Paginated diagnosis history filters |
| `GET` | `/api/analytics/abandonment-rate/` | Abandonment-rate endpoint |
| `GET` | `/api/analytics/feature-importance/` | Aggregated SHAP/feature importance |
| `GET` | `/api/analytics/recommendation/` | Legacy recommendation list, auto-marks created as viewed |
| `PATCH` | `/api/analytics/recommendation/<id>/implement/` | Marks recommendation implemented |
| `GET` | `/api/sessions/` | Sessions list |
| `GET` | `/api/sessions/<session_id>/` | Session detail |
| `GET` | `/api/predictions/` | Prediction list |
| `GET` | `/api/ablation/summary/` | Model variant summary |
| `POST` | `/api/export/` | Body includes `export_type`, optional `model_variant`; triggers Celery export |
| `GET` | `/api/health/` | Health/dependency check |
| `GET` | `/api/diagnosis/` | Diagnosis list |
| `GET` | `/api/diagnosis/<id>/` | Diagnosis detail |
| `GET` | `/api/tenants/` | Tenant list |
| `GET` | `/api/tenants/<id>/` | Tenant detail |

Error handling:

- Unresolved tenant returns `403 {"detail": "Forbidden"}`.
- Missing records commonly return `404 {"detail": "Not found"}`.
- Invalid status values return `400`.
- Global DRF exception handler configured in `main_service.exceptions.custom_exception_handler`.

### Observer FastAPI (`observer_experiment`)

Endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | PostgreSQL required; Kafka/Redis optional fan-outs reported |
| `GET` | `/ready` | Deep dependency status, `207` if optional deps degraded |
| `POST` | `/track` | Event ingestion |
| `POST` | `/events` | Alias for ingestion |
| `POST` | `/collect` | Alias for ingestion |
| `GET` | `/api/keys/validate` | Validate key prefix/allowlist |
| `POST` | `/api/keys/validate` | Validate key from JSON body |
| `POST` | `/api/keys/generate` | Generate dev key string; not persisted |
| `GET` | `/api/keys/status` | Returns allowlist enabled/count only |
| `GET` | `/api/field-catalog` | Field catalog |
| `GET` | `/viewer` | Embedded viewer HTML |
| `GET` | `/snippet-test` | Snippet test HTML |
| `GET` | `/events` | Query raw events |
| `GET` | `/stats` | Raw event stats |
| `GET` | `/session/{session_id}` | Raw event timeline for one session |
| `GET` | `/fields` | Payload field analysis |
| `GET` | `/visitor/{visitor_id}` | Visitor session history |
| `POST` | `/query` | Admin-only SELECT query |
| `DELETE` | `/clear` | Admin-only delete raw events |

Request body:

- Event ingestion accepts a JSON object containing `api_key` or `X-API-Key`, `session_id`, `visitor_id`, `event_type`, timestamps, URL/referrer, and tier-specific event fields.

Response:

- Successful ingestion returns `status`, numeric `id`, `tier`, `received_fields`, and `payload_field_count`.

Authentication/API key behavior:

- Accepts API key from `X-API-Key`, `Authorization: Bearer`, or JSON `api_key`.
- Valid prefixes: `tk_basic_` -> `T3`, `tk_smart_` -> `T2`, `tk_full_` -> `T1`.
- If `OBSERVER_API_KEYS` allowlist is configured, full key string must match.
- In Compose, `OBSERVER_API_KEYS` default is empty, so prefix validation is enough unless configured otherwise.
- API key values are not validated against Django `APIKey.key_hash` in the active Observer FastAPI path.

Tenant behavior:

- `tenant_id` can be sent in the event payload and is preserved in JSONB/Kafka payload.
- Observer does not verify that `tenant_id` belongs to the API key in the inspected code.

Swagger/OpenAPI:

- FastAPI default `/docs` and `/openapi.json` are implicitly available unless disabled; no custom OpenAPI file found.

### Session FastAPI (`session/session`)

Endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Redis and Kafka health |
| `GET` | `/ready` | Redis, Kafka, PostgreSQL readiness |
| `POST` | `/ingest/raw-event` | Optional HTTP ingest from Observer |
| `POST` | `/ingest/flush-session` | Force final session flush |
| `GET` | `/viewer` | Embedded viewer |
| `GET` | `/viewer/status` | Dependency and telemetry status |
| `GET` | `/viewer/events` | Viewer telemetry events |

Request/response:

- `/ingest/raw-event` accepts Observer event JSON. It returns `{"status":"ok","duplicate": bool}`.
- `/ingest/flush-session` accepts `{"session_id": "..."}` and returns `{"status":"ok","session_id":"..."}` or 404 if no Redis session exists.

Authentication:

- Optional `SESSION_INGEST_API_KEY`; if set, `X-API-Key` is required.
- In Compose no session ingest API key is set.

### Feature FastAPI (`feature/feature_svc`)

Endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Consumer and Kafka reachability |
| `GET` | `/ready` | Consumer running status |
| `GET` | `/viewer` | Embedded viewer |
| `GET` | `/viewer/status` | Runtime status |

No HTTP feature-compute endpoint found. Feature processing is Kafka-based.

### ML FastAPI (`ml`)

Endpoints:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Model, consumer, producer status |
| `POST` | `/predict` | Direct prediction for one `FeatureVector` JSON |
| `GET` | `/model/info` | Model metadata and feature list |
| `POST` | `/model/reload` | Reload XGBoost model |
| `GET` | `/viewer` | Embedded viewer |
| `GET` | `/internal/status` | Detailed pipeline status |

Swagger/OpenAPI:

- FastAPI default `/docs` and `/openapi.json` are implicitly available unless disabled.

### Demo Ecommerce Next API (`sneaker-store`)

Route handlers found:

| Method | Path |
|---|---|
| `GET` | `/api/products` |
| `GET` | `/api/products/[id]` |
| `GET` | `/api/cart` |
| `POST` | `/api/orders` |
| `POST` | `/api/orders/[id]/cancel` |
| `POST` | `/api/orders/[id]/refund` |
| `PATCH` | `/api/orders/[id]/status` |
| `POST` | `/api/register` |
| `GET/POST` | `/api/wishlist` |
| `POST` | `/api/auth/verify-email` |
| `POST` | `/api/auth/password-reset/request` |
| `POST` | `/api/auth/password-reset/confirm` |
| NextAuth route | `/api/auth/[...nextauth]` |
| `GET` | `/api/admin/metrics` |
| `GET/POST` | `/api/admin/coupons` |
| `GET` | `/api/admin/catalog-options` |
| `POST` | `/api/admin/products` |
| `PATCH/DELETE` | `/api/admin/products/[id]` |
| `POST` | `/api/admin/upload` |
| `POST` | `/api/admin/taxonomy/[resource]` |
| `PATCH/DELETE` | `/api/admin/taxonomy/[resource]/[id]` |

## 4. Observer/Snippet Implementation

Snippet path:

- `observer_experiment/observer/snippet/track.js`

Installation:

- Dashboard integration endpoint returns a script tag pointing to `/static/snippet/track.js?key=...`.
- Demo shop loads the snippet in `sneaker-store/src/app/layout.tsx` using `NEXT_PUBLIC_OBSERVER_URL` and `NEXT_PUBLIC_OBSERVER_SNIPPET_KEY`.
- Snippet also accepts `window.__OBSERVER_BASE__`, `window.__OBSERVER_API_KEY__`, and `window.__OBSERVER_TENANT_ID__`.

Captured events/signals found in `track.js`:

| Signal | Implemented? | Evidence |
|---|---|---|
| Page view | yes | `sendEvent('page_view')` |
| Click count | yes | document click listener increments `state.click_count` |
| Scroll depth/up/down | yes | scroll listener updates `max_scroll_pct`, `scroll_up_count`, velocity |
| Add to cart | yes | `data-ca="cart_add"` delegated click handling |
| Remove from cart | yes | `data-ca="cart_remove"` delegated click handling |
| Checkout started | partially | inferred checkout page/step and `data-ca-step`; checkout event depends on page/app data attributes |
| Purchase completed | yes | purchase path heuristic and `window._ca.sendPurchase()` |
| JavaScript errors | yes, T2+ | `error` and `unhandledrejection` listeners send `js_error` counts |
| Device info | yes | user agent, mobile/tablet/desktop, language/timezone |
| Referrer/source | yes | `document.referrer`, URL-derived source data |
| Session/user IDs | yes | visitor cookie `_ca_visitor`, sessionStorage `_ca_session` |
| Form interaction count | yes | focusin/focusout counters; no field values observed in snippet |
| Copy/paste | yes | sends copy/paste events and counts; code avoids copied text content |
| Rage clicks | yes | repeated same target/near coordinate heuristic |
| Outbound clicks | yes | anchor host differs from current host |
| Product impressions | yes | IntersectionObserver over product-like selectors |
| Popup open | yes | MutationObserver |
| Heartbeat | yes | interval every 30 seconds |

Payload sending:

- Uses `fetch(OBSERVER_URL, { method: "POST", headers: {"Content-Type":"application/json","X-API-Key": API_KEY}, body: JSON.stringify(payload), credentials:"omit", keepalive: ... })`.
- Server endpoint is `/track`.

Batching/retry:

- No event batching queue found in snippet.
- No retry loop found in snippet.
- `beforeunload` uses `keepalive`.

Sensitive data handling:

- Snippet does not send form input values in inspected code; it counts fields and touched fields.
- Server strips forbidden keys: `api_key`, `authorization`, `password`, `token`, `secret`.
- `credentials: "omit"` is set on fetch.

## 5. Kafka/Data Pipeline

### Broker Configuration

- Compose Kafka image: `apache/kafka:3.7.1`
- KRaft single-node broker/controller.
- Advertised listener: internal `kafka:9092`.
- Port exposed: `9092`.

### Topics, Producers, Consumers

| Topic | Produced by | Consumed by | Notes |
|---|---|---|---|
| `raw_events` | Observer FastAPI (`observer.kafka_producer`) | Session service (`app.consumer`) | Active event stream |
| `session_enriched` | Session service (`app.emitter`, `app.scheduler`) | Feature service (`kafka_consumer.run_consumer`) | Final and windowed session messages |
| `feature_ready` | Feature service (`emit_feature_vector`) | ML service (`app.consumer`) | Feature vector contract |
| `prediction_done` | ML service (`publish_prediction`) | Main Django consumer (`consume_prediction_done`) | Main persistence/diagnosis input |
| `prediction_done_v2` | ML service (`publish_prediction_v2`) | NOT FOUND as consumed by Main | Created by Compose but no Main consumer found |
| `prediction_dlq` | ML consumer on repeated failures | NOT FOUND as created by `kafka-init` | Auto-create possible |
| `prediction_done_dlq` | Main consumer for invalid prediction messages | NOT FOUND as created by `kafka-init` | Auto-create possible |

### Message Schemas / Examples

| Message | Schema source | Shape |
|---|---|---|
| `raw_events` | `observer.models.payload.EventPayload`, `observer.models.event` | Flat event dict with core fields (`event_id`, `visitor_id`, `session_id`, `tenant_id`, `event_type`, `url`, `referrer`, `timestamp`) plus tier-filtered payload fields and `tier` |
| `session_enriched` | `session/session/app/models.py` | `session_id`, `visitor_id`, `tenant_id`, `started_at`, `window_seconds`, `session_state`, `has_purchase_success`, `has_checkout_start`, `has_cart_activity`, `final_event_type`, `event_sequence`, `aggregated_fields` |
| `feature_ready` | `feature/feature_svc/models.py`, `schemas/feature_ready.json` | `session_id`, `tenant_id`, `version`, `variant`, `features`, `computed_at`, `window_seconds`, business metadata |
| `prediction_done` | `ml/app/schemas.py`, `ml/app/producer.py` | `session_id`, `tenant_id`, `organization_id`, `visitor_id`, `abandonment_probability`, `predicted_label`, `predicted_class`, `model_name`, `model_version`, `threshold`, `top_features`, `features`, timestamps, session metadata |

### Retry/Error Behavior

- Observer: starts Kafka producer if available; publish failure logs and does not fail `/track` if DB write succeeded.
- Session: manual Kafka commits after successful processing; poison-pill messages are committed; Redis failures back off and do not commit.
- Feature: malformed `session_enriched` is committed and skipped; compute or publish failure is not committed so it can replay.
- ML: per-message retry counter; after 3 failures forwards to `prediction_dlq` and commits.
- Main consumer: invalid JSON/field messages go to DLQ and are committed; processing exceptions are not committed.

### Actual Pipeline

Implemented active Docker path:

```text
Observer /track
-> PostgreSQL raw_events
-> Kafka raw_events
-> Session Redis aggregation + PostgreSQL sessions.sessions
-> Kafka session_enriched
-> Feature service
-> Kafka feature_ready
-> ML XGBoost prediction
-> Kafka prediction_done and prediction_done_v2
-> Main Django consumer
-> Session / PredictionResult / Diagnosis / Recommendation tables
-> Dashboard API
```

This matches the intended pipeline except `prediction_done_v2` is produced but not found as consumed by Main.

## 6. Redis/Sessionization

### Redis Usage

| Component | Redis usage |
|---|---|
| Observer | Optional fan-out queues/lists after PostgreSQL ingest |
| Session | Primary in-memory session hash, deadline zset, duplicate event guard, window scheduling idempotency |
| Main | Celery broker/result backend; DuckDB write lock; prediction consumer readiness marker; legacy diagnosis queue |

### Redis Keys / Patterns Found

| Key pattern | Service | Purpose |
|---|---|---|
| `session:{session_id}` | Session | Session hash with accumulated fields |
| `visitor:{visitor_id}:active` | Session | Active session pointer |
| `session_deadlines` | Session | Sorted set of session idle deadlines |
| `session_flush_lock:{session_id}` | Session | Prevent double flush |
| `session:evt:{event_id}` | Session | Deduplicate Kafka + HTTP duplicate delivery |
| `session_timer:{session_id}:{window}` | Session | Window timer cleanup |
| `session_winsched:{session_id}:{window}` | Session | Window snapshot idempotency |
| `ca:events:{visitor_id}` | Observer | Optional event list, TTL 24h |
| `ca:diagnosis:queue` | Observer/Main legacy | Session-end queue for legacy diagnosis path |
| `main:prediction_done_consumer:ready` | Main | Consumer readiness marker |
| `duckdb:write_lock` | Main | DuckDB write serialization |

### TTL / Session Timeout

- `SESSION_TTL_SECONDS` default in service config is 1800 seconds.
- Compose overrides `SESSION_TTL_SECONDS` to `120`.
- Session hash TTL is `SESSION_TTL_SECONDS + 60`.
- Active visitor key TTL is `SESSION_TTL_SECONDS`.
- Duplicate event key TTL is 7 days.

### Session States

Actual enum in `session/session/app/models.py`:

- `NEW`
- `ACTIVE`
- `ABANDONED`
- `CONVERTED`

State transitions:

- New Redis hash starts as `NEW`.
- Later events set `ACTIVE`.
- `purchase_success` / `order_success` / `is_order_success` sets terminal `CONVERTED`.
- Idle timeout flush sets non-converted sessions to `ABANDONED`.
- Converted sessions are protected from timeout reclassification.

Redis failure behavior:

- Observer Redis is optional; failure logs/skips but `/track` can still succeed.
- Session Redis is required for health/readiness; consumer backs off on Redis errors and avoids committing offsets.

## 7. PostgreSQL/Database Schema

### Main Django Models

`main_service/apps/tenants/models.py`:

- `Tenant`: `name`, `external_id` UUID unique/db_index, `domain` unique, `status`, `tier`, `timezone`, `created_at`
- `APIKey`: FK `tenant`, `name`, `key_hash` unique/db_index, `prefix`, `tier`, `suffix_len`, `is_active`, `created_at`, `last_shown_at`
- `TeamMember`: FK `tenant`, FK `user`, `role`, `created_at`; unique `(tenant,user)`

`main_service/apps/analytics/models.py`:

- `Session`: `session_id` unique, `visitor_id`, FK `tenant`, `started_at`, `ended_at`, `event_count`, `page_views`, `device_type`, `session_state`, purchase/cart flags, `final_event_type`, `event_sequence` JSON, indexes by tenant/date.
- `PredictionResult`: OneToOne `Session`, FK `tenant`, score/class fields, `shap_values` JSON, model metadata, business override fields, `outcome_metadata` JSON.
- `VisitorOutcome`: OneToOne `Session`, `actual_abandoned`, `outcome_observed_at`.
- `Diagnosis`: FK `tenant`, `session_id`, `visitor_id`, tier, `score_s1` through `score_s7`, probability/class/model fields, `dominant_reason`, `reason_label`, `explanation`, `top_features` JSON, optional `vg_entropy`, `vg_motifs` JSON, status. Unique `(tenant, session_id)`.
- `Recommendation`: OneToOne `Diagnosis`, FK `tenant`, `text_mn`, `dominant_score`, status, implementation metadata.
- `ProcessedSession`: idempotency guard keyed by `observer_session_id`.

### Observer Raw Events

`observer_experiment/observer/database.py` creates table `raw_events`:

- `id BIGSERIAL PRIMARY KEY`
- `event_id TEXT UNIQUE`
- `visitor_id TEXT`
- `session_id TEXT`
- `event_type TEXT`
- `url TEXT`
- `referrer TEXT`
- `timestamp TEXT`
- `ip TEXT`
- `user_agent TEXT`
- `payload JSONB`
- `created_at TIMESTAMPTZ`
- `tier TEXT`

Indexes:

- `session_id`
- `visitor_id`
- `event_type`
- `created_at DESC`
- GIN index on `payload`
- `tier`

Note: no dedicated `tenant_id` column exists in this table. `tenant_id` is stored in `payload` if present.

### Session Service Schema

`session/session/app/db.py` creates schema/table:

- Schema: `sessions`
- Table: `sessions.sessions`
- Fields: `session_id`, `visitor_id`, `tenant_id`, `started_at`, `ended_at`, `event_count`, `page_views`, `session_duration_sec`, generated `duration_ms`, `state`, `device_type`, `is_completed_purchase`, `abandoned`, `end_reason`, `raw_session_payload JSONB`
- Indexes: visitor, started_at, tenant, state

### ML Prediction Schema

`ml/app/db.py` creates:

- Schema: `predictions`
- Table: `predictions.predictions`
- Fields: `prediction_id`, `session_id`, `tenant_id`, `predicted_at`, `window_seconds`, `abandon_probability`, `diagnosis_category`, `shap_values JSONB`, `model_version`, `feature_vector_version`
- Indexes: session, tenant/date

### Demo Store Prisma Schema

`sneaker-store/prisma/schema.prisma` contains ecommerce/auth models with JSON fields including:

- `address Json?`
- `settings Json?`
- `deliveryAddress Json`
- `timeline Json?`
- `payload Json?`

Full model list not expanded here; Prisma schema exists and is used by `npx prisma db push` in Compose.

### API Key Storage

- Django `APIKey` stores SHA-256 hashes, not raw keys.
- Observer FastAPI local key generation does not persist keys.
- Observer allowlist, if enabled, uses raw full key strings in environment variable `OBSERVER_API_KEYS`.

## 8. Feature Engineering

### Files

- `feature/feature_svc/models.py`
- `feature/feature_svc/features/__init__.py`
- `feature/feature_svc/features/frustration.py`
- `feature/feature_svc/features/commitment.py`
- `feature/feature_svc/features/price.py`
- `feature/feature_svc/features/trust.py`
- `feature/feature_svc/features/hedonic.py`
- `feature/feature_svc/features/temporal.py`
- `feature/feature_svc/features/products.py`
- `feature/feature_svc/features/mouse.py`
- `feature/feature_svc/features/raw_passthrough.py`
- `feature/feature_svc/schemas/feature_ready.json`

### Feature Count

- `EXPECTED_FEATURE_COUNT = 76` in `features/__init__.py`.
- `FeatureSet` currently defines 76 fields.
- ML model artifact metadata says training used 38 features (`ml/models/dataset_metadata.json` and `feature_order.json`).

This is PARTIALLY IMPLEMENTED across service boundary: Feature service emits 76 fields, while the current trained XGBoost artifact uses a 38-feature order and fills missing model fields safely.

### Input Format

`SessionEnriched`:

- UUID `session_id`, `visitor_id`, `tenant_id`
- `started_at`
- optional `window_seconds`
- session business metadata
- `event_sequence`
- `aggregated_fields`

### Output Format

`FeatureVector`:

- `session_id`
- `tenant_id`
- `version`
- `variant`: `A`, `B`, `C`, or `D`
- `features`: immutable `FeatureSet`
- `computed_at`
- `window_seconds`
- business metadata outside `features`

### Behavioral Features Implemented

Raw/pass-through and computed fields include:

- active time: `active_time_ms`
- page duration: `time_on_page_sec`, `session_duration_sec`
- click count: `click_count`
- scroll depth: `max_scroll_pct`, `scroll_up_count`
- back navigation: `back_navigation`
- rage clicks: `rage_click`, `frustration_index`
- checkout delay/progress: `checkout_step_detected`, `checkout_step`, `time_to_first_action_ms`
- cart value: `cart_value`, `cart_item_count`
- discount/coupon: `discount_code`, `coupon_entered`, `is_sale`
- device type: `device_type`, derived `is_mobile`
- referral/source: `referrer`
- navigation/product breadth: `dist_product_count`
- mouse movement: `mouse_distance`, `mouse_speed`, `direction_changes`
- trust/payment: `mongolian_trust_barrier`, `payment_method`, `product_availability`
- price: `price_hesitation_score`, `avg_price_in_session`
- temporal cyclic features: `hour_sin`, `hour_cos`, `dow_sin`, `dow_cos`

Navigation entropy / HVG:

- Mouse features are computed.
- Variant `D` can fetch graph features from `GRAPH_DB_DSN` table `graph_features`.
- Separate `main_service/vg_service` Flask code computes entropy/motifs.
- No active Docker Compose wiring found for VG service. Status: PARTIALLY IMPLEMENTED.

Missing value handling:

- `AggregatedFields` converts nulls to defaults and numeric strings to numbers.
- `FeatureComputer` fills missing values from `FeatureSet` defaults.
- NaN/Inf are converted to `0.0`.
- A feature count mismatch raises `ValueError`.

## 9. ML / Prediction / Diagnosis

### XGBoost

Implemented.

Evidence:

- `ml/app/xgboost_model.py` loads a pickled/joblib `xgb.XGBClassifier`.
- `ml/models/xgb_cart_abandonment.joblib` exists.
- `ml/scripts/train.py` trains and stores XGBoost model artifacts.

### LSTM

PARTIALLY IMPLEMENTED / future work.

Evidence:

- `ml/app/lstm_model.py` defines `LSTMClassifier` and `LSTMModel`.
- `ml/app/pipeline.py` does not load/use LSTM; `lstm_loaded` returns `False`.
- `/model/info` returns `lstm_status: "future_work_disabled"`.
- `ensemble_weight_lstm=0.0` in config.

### SHAP

Implemented when `shap` is installed and `SHAP_ENABLED=true`.

- `XGBoostModel.predict_with_shap()` builds `shap.TreeExplainer`.
- If SHAP fails, it logs and returns prediction without SHAP values.

### Prediction Flow

- ML consumes `feature_ready`.
- It validates `FeatureVector`.
- Runs XGBoost prediction.
- Clamps probability to `[0,1]`.
- Applies threshold from model artifact/config.
- Emits canonical prediction payload to `prediction_done` and `prediction_done_v2`.
- Writes legacy prediction row to `predictions.predictions`.

### Model Artifacts / Training

Files found:

- `ml/models/xgb_cart_abandonment.joblib`
- `ml/models/model_baseline_xgboost.pkl`
- `ml/models/model_extended_xgboost.pkl`
- `ml/models/model_full_xgboost.pkl`
- `ml/models/feature_order.json`
- `ml/models/metrics_xgboost.json`
- `ml/scripts/train.py`
- `ml/scripts/generate_synthetic_sessions.py`

Current metadata:

- Synthetic dataset: yes
- Rows: 1200
- Features in model artifact metadata: 38
- Label definition: `1 = abandoned checkout/session, 0 = converted purchase_success`

### S1-S7 Diagnosis

Canonical scorer:

- `main_service/apps/analytics/s1_s7.py`
- Main prediction consumer calls `calculate_s1_s7(features)` inside `handle_prediction_payload()`.
- Diagnosis is skipped for converted/purchase-success sessions.

| Score | Meaning in code | Input features | Formula/rule summary | File path | Implemented |
|---|---|---|---|---|---|
| S1 | Psychological hesitation | `tab_hidden_count`, `copy_count`, `time_on_page_sec`, `bounce`, `cart_abandonment_signal` / `abandoned` | Weighted normalized hesitation signals | `main_service/apps/analytics/s1_s7.py` | yes |
| S2 | Technical friction | `rage_click`, `js_error`, `page_load_ms`, form fields/touched, `back_navigation` | Weighted friction/errors/slow-load/form-friction | same | yes |
| S3 | Trust issue | `mongolian_trust_barrier`, `is_logged_in`, `payment_method`, `product_availability`, checkout step | Weighted trust/payment/availability/guest checkout | same | yes |
| S4 | Mobile usability issue | `is_mobile`/`device_type`, `page_load_ms`, `rage_click`, `scroll_up_count`, `tab_hidden_count`, `bounce` | Mobile gate multiplied by mobile friction score | same | yes |
| S5 | Price sensitivity | `price_hesitation_score`, `coupon_entered`, `discount_code`, `is_sale`, `cart_value`, `order_total`, `avg_price_in_session` | Weighted price/coupon/high-cart-value signals | same | yes |
| S6 | Indecision/navigation disorder | `cart_churn_count`, `back_navigation`, `dist_product_count`, search/filter, `scroll_up_count` | Weighted navigation loop and indecision signals | same | yes |
| S7 | External influence/referral effect | `outbound_click`, `referrer`, `end_reason`, `tab_hidden_count` | Weighted outbound/social/external/referral signals | same | yes |

Dominant reason:

- `dominant_reason = max(scores, key=lambda key: scores[key])`.

Fallback/rule-based diagnosis:

- S1-S7 scoring is deterministic rule-based.
- ML model predicts probability/class; diagnosis reasons come from deterministic feature formulas.

## 10. Recommendation Generation

### Gemini

Implemented with fallback.

Files:

- `main_service/apps/analytics/gemini_client.py`
- `main_service/apps/diagnosis/gemini.py`

Gemini behavior:

- Uses `google.genai.Client(api_key=settings.GEMINI_API_KEY)`.
- Model: `gemini-1.5-flash`.
- Structured prompt asks for business-friendly Mongolian text and valid JSON.
- API key value is not included in this report.

### Fallback Logic

If no Gemini key or Gemini returns invalid/error:

- `fallback_structured_recommendation()` returns deterministic JSON.
- Recommendation includes dominant reason, probability, priority, effort, impact, evidence, action steps, warning, and source.

Language support:

- Structured Gemini prompt explicitly requests Mongolian.
- Fallback structured text is English in the inspected code.
- Legacy `generate_recommendation_mn()` name suggests Mongolian, but fallback text is English.
- Status: PARTIALLY IMPLEMENTED for Mongolian recommendation text.

### Output Fields

Structured recommendation payload fields:

- `title`
- `summary`
- `reason_code`
- `priority`
- `effort`
- `expected_impact`
- `evidence`
- `action_steps`
- `warning`
- `source`

Dashboard API also returns:

- `id`
- `body`
- `reason_label`
- `status`
- `created_at`
- `session_id`

### Status Values

Model statuses:

- `created`
- `viewed`
- `in_progress`
- `implemented`
- `dismissed`

Dashboard API statuses:

- `new`
- `in_progress`
- `done`
- `dismissed`

Legacy recommendation view maps some statuses to `pending` / `done`.

## 11. Dashboard/Frontend

### Analytics Dashboard (`cart_analytic`)

Framework:

- Next.js 16
- React 19
- TypeScript
- Recharts
- lucide-react

Routes found:

```text
/                         /login
/signup                   /forgot-password
/reset-password           /dashboard
/overview                 /analytics
/diagnosis                /diagnosis/[id]
/diagnostics              /recommendations
/sessions                 /sessions/[id]
/installation             /pipeline
/ml-insights              /settings
/profile                  /tenants
/tenants/[id]             /admin
/setup
```

Important service clients:

- `src/lib/api-client.ts`: API request wrapper, JWT refresh, API key header support, timeout, error handling.
- `src/lib/api-config.ts`: endpoint map and auth mode config.
- `src/lib/services/dashboard-mvp.ts`: dashboard overview/reasons/sessions/recommendations/integration.
- `src/lib/services/auth.ts`: login/refresh.
- `src/lib/services/diagnosis.ts`: diagnosis list/detail.
- `src/lib/services/recommendations.ts`: recommendation list/status.
- `src/lib/services/sessions.ts`: sessions list/detail.
- `src/lib/services/settings.ts`: store/team settings.

UI components:

- Chart components: abandonment trend, feature importance bar, prediction histogram, SHAP waterfall.
- UI components: KPI cards, risk bars, code block card, filter toolbar, table shell, status panel, kanban cards/columns.
- Editorial shell/navigation components.

Implemented pages based on routes/components:

- Login/signup/forgot/reset password pages.
- Dashboard/overview analytics pages.
- Diagnosis list/detail pages.
- Recommendation page.
- Session list/detail pages.
- Installation page that shows Observer snippet and Kafka topics.
- Pipeline and ML insight pages.
- Settings/profile/tenant pages.

Auth handling:

- JWT access/refresh tokens stored in `localStorage`.
- API wrapper refreshes token if expired and redirects to `/login` on failure.
- Optional API key auth mode exists via `NEXT_PUBLIC_API_AUTH_MODE`.

Mock fallback:

- `NEXT_PUBLIC_MOCK_FALLBACK=true` enables frontend mock responses.
- Compose sets `NEXT_PUBLIC_MOCK_FALLBACK=false`.

### Demo Ecommerce (`sneaker-store`)

Framework:

- Next.js 16
- React 19
- TypeScript
- Prisma
- NextAuth
- Zustand cart store

Routes found:

```text
/                         /products
/products/[id]            /search
/cart                     /checkout
/order/[id]               /account
/login                    /register
/reset-password           /admin
/admin/products           /admin/products/new
/admin/products/[id]/edit /admin/orders
/admin/coupons            /admin/taxonomy
/admin/analytics          /privacy
/shipping                 /returns
/terms
```

Observer integration:

- `src/app/layout.tsx` injects Observer config and loads `track.js`.
- `src/components/CaCommerceSync.tsx` syncs cart value, cart item count, and auth status to `window._ca_user`.
- `src/lib/commerce-attrs.ts` creates `data-ca-*` attributes for product/cart/checkout tracking.
- `src/components/ThesisDemoPanel.tsx` exists and is part of the demo/thesis flow.

## 12. Tests And Validation

### Test Frameworks

| Service | Framework |
|---|---|
| Main Django | pytest, pytest-django |
| Observer | pytest, pytest-asyncio, httpx test client/mocks |
| Session | pytest, pytest-asyncio, fakeredis |
| Feature | pytest, pytest-asyncio |
| ML | pytest, pytest-asyncio, mocked model/Kafka |
| Dashboard/demo frontends | ESLint and Next build scripts; no Jest/Vitest test files found |

### Test Files And Coverage Intent

Main:

- `main_service/apps/analytics/test_s1_s7.py`: S1-S7 normalization, each score dominance, known S5 synthetic case.
- `main_service/apps/analytics/tests.py`: recommendation viewed transition, cross-tenant isolation, idempotency, prediction payload persistence, purchase-success converted guard, dashboard contracts, recommendation status patch, integration snippet path.
- `main_service/apps/tenants/tests.py`: raw key not persisted, observer script returned.
- `main_service/apps/diagnosis/tests.py`: Gemini fallback.
- `main_service/vg_service/tests.py`: HVG visibility, motifs, entropy bounds.

Observer:

- `observer_experiment/tests/test_ingest.py`: tier event ingestion, aliases, missing/invalid API keys, invalid JSON, max body, event_id forwarding, forbidden key stripping, Kafka disabled behavior, health/ready.
- `observer_experiment/tests/test_models.py`: tier prefixes, field filtering, T1/T2/T3 behavior, forbidden keys, alias handling, timestamp/session validation.

Session:

- `session/session/tests/test_assembler.py`: session create/update, converted terminal state, counters, TTL/deadline zset, DB-before-Kafka flush, failure safety, locks, bot skip, purchase/session-end flush.
- `session/session/tests/test_consumer.py`: Kafka normalization, poison-pill commit, failure replay, Redis backoff, backpressure.

Feature:

- `feature/feature_svc/tests/test_commitment.py`: commitment depth.
- `feature/feature_svc/tests/test_frustration.py`: frustration score.
- `feature/feature_svc/tests/test_temporal.py`: temporal features.
- `feature/feature_svc/tests/test_integration.py`: defaults, numeric coercion, JSON serialization, outcome metadata outside features, full feature vector.

ML:

- `ml/tests/test_pipeline.py`: XGBoost-only prediction contract, converted below threshold, metadata pass-through, score clamp, missing model feature safety.
- `ml/tests/test_producer.py`: retry failure, canonical payload, Kafka key.

E2E/scripts:

- `scripts/e2e_mvp.py`: sends abandoned/converted events and polls diagnosis.
- `scripts/audit/e2e_three_use_cases.py`: three audit use cases including technical/mobile abandonment, converted purchase, price-sensitive abandonment.

### Test Status

Run during this report:

- `docker compose config --quiet`: PASS

Not run during this report generation:

- Full pytest suites
- Frontend lint/build
- Docker Compose `up -d --build`
- Browser smoke tests

Existing repository evidence:

- `docs/final_audit/test_and_build_results.md` records PASS for root compose config, Main pytest, Observer pytest, Session pytest, Feature pytest, ML pytest, dashboard lint/build, demo lint/build.
- Because those are existing files, not freshly executed in this run, treat them as stored evidence rather than current verification.

Coverage status for requested checks:

| Requested validation | Status in code/tests |
|---|---|
| Feature vector structure | Implemented in Feature tests |
| S1-S7 score logic | Implemented in Main tests |
| Kafka/data flow | Partially tested with unit mocks; E2E scripts exist |
| End-to-end pipeline | Scripts exist; stored audit evidence exists |
| API authentication/API key protection | Observer and tenant tests exist |
| API response schema | Dashboard contract tests exist |
| ML training/evaluation | Training script and metrics artifacts exist; tests mock inference pipeline |

## 13. Commands And Reproducibility

### Install Dependencies

```bash
cd main_service
python -m pip install -r requirements.txt

cd ../observer_experiment
python -m pip install -r requirements.txt

cd ../session/session
python -m pip install -r requirements.txt

cd ../../feature/feature_svc
python -m pip install -r requirements.txt

cd ../../ml
python -m pip install -r requirements.txt

cd ../cart_analytic
npm ci

cd ../sneaker-store
npm ci
```

### Start Services

```bash
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

### Run Migrations / Seed

Compose runs these automatically for Main:

```bash
cd main_service
python manage.py migrate --noinput
python manage.py seed_demo_tenant
```

Demo shop database setup from Compose:

```bash
cd sneaker-store
npx prisma db push
npm run prisma:seed
```

### Run Backend Tests

```bash
cd main_service
python -m pytest -q

cd ../observer_experiment
python -m pytest -q

cd ../session/session
python -m pytest -q

cd ../../feature/feature_svc
python -m pytest -q

cd ../../ml
python -m pytest -q
```

### Run Frontend Checks

```bash
cd cart_analytic
npm run lint
npm run build

cd ../sneaker-store
npm run lint
npm run build
```

### Run ML Training / Evaluation

```bash
cd ml
python scripts/train.py --dataset ../data/sessions.csv --output models/xgb_cart_abandonment.joblib
```

### Run E2E Scripts

```bash
python scripts/e2e_mvp.py
python scripts/audit/e2e_three_use_cases.py
```

## 14. Thesis Alignment Check

| Thesis claim | Evidence from code | Status | File paths | Notes |
|---|---|---|---|---|
| Docker Compose runs all services | Compose defines Postgres, Redis, Kafka, Main, Observer, Session, Feature, ML, dashboard, demo shop | implemented | `docker-compose.yml` | `docker compose config --quiet` passed |
| Observer service collects user events | FastAPI `/track`; `track.js` sends browser events | implemented | `observer_experiment/observer/main.py`, `observer_experiment/observer/snippet/track.js` | DB write first, Kafka/Redis/session fan-out |
| API key validation exists | Observer prefix/allowlist validation; Django APIKey hash model and generation | partial | `observer/middleware/auth.py`, `apps/tenants/models.py` | Active Observer does not validate against Django hashed APIKey table |
| PostgreSQL stores events/sessions/diagnosis | raw_events, sessions.sessions, predictions.predictions, Django analytics models | implemented | `observer/database.py`, `session/app/db.py`, `ml/app/db.py`, `apps/analytics/models.py` | Multiple schemas/tables |
| Kafka passes events between services | Topics and producers/consumers found | implemented | `docker-compose.yml`, producer/consumer files | `prediction_done_v2` produced but no Main consumer found |
| Redis is used for temporary/session storage | Session hash/deadline keys; observer optional queue; main Celery/locks | implemented | `session/app/assembler.py`, `observer/redis_queue.py`, `main_service/settings.py` | Redis critical for Session |
| Session service aggregates events | `accumulate_event()` and `flush_session()` | implemented | `session/session/app/assembler.py` | Stores to Redis, writes Postgres, emits Kafka |
| Feature service creates behavioral feature vectors | `FeatureComputer` emits `FeatureVector` | implemented | `feature/feature_svc/features/__init__.py`, `models.py` | Emits 76 fields |
| ML service predicts abandonment probability | XGBoost pipeline and `/predict` | implemented | `ml/app/pipeline.py`, `ml/app/xgboost_model.py` | LSTM disabled |
| S1-S7 diagnosis scores are calculated | Canonical scorer | implemented | `main_service/apps/analytics/s1_s7.py` | Rule-based |
| Gemini or fallback recommendation generation exists | Gemini client and deterministic fallback | implemented | `main_service/apps/analytics/gemini_client.py` | Mongolian prompt but English fallback |
| Dashboard displays analytics/diagnosis/recommendations | Next routes and service clients | implemented | `cart_analytic/src/app`, `cart_analytic/src/lib/services` | Mock fallback also present but disabled in Compose |
| Tests validate key system functions | pytest suites and audit scripts | implemented | test folders, `docs/final_audit/test_and_build_results.md` | Full suite not rerun in this report |

## 15. Material For Thesis Chapter IV

Энэхүү систем нь цахим худалдааны хэрэглэгчийн зан төлөвөөс сагс орхилтын шалтгааныг тодорхойлох туршилтын хувилбар хэлбэрээр хэрэгжүүлсэн байна. Хэрэгжилтийн орчин нь Docker Compose дээр суурилж, PostgreSQL, Redis, Kafka болон Python/TypeScript үйлчилгээний багцыг нэгтгэн ажиллуулах бүтэцтэй. Compose тохиргоонд Observer, Session, Feature, ML, Main API, Analytics dashboard болон demo ecommerce store тус тусдаа service хэлбэрээр тодорхойлогдсон.

Өгөгдлийн урсгалын эхлэл нь demo ecommerce storefront-д суулгасан Observer snippet юм. Snippet нь page view, scroll, click, cart, checkout, purchase, JavaScript error, device, referrer, session болон visitor identifier зэрэг browser-side дохиог цуглуулж `/track` endpoint руу илгээдэг. Observer service нь API key prefix болон optional allowlist шалгалт хийж, зөвшөөрөгдсөн талбаруудыг tier-ээр шүүн PostgreSQL `raw_events` хүснэгтэд хадгалдаг. Үүний дараа raw event-ийг Kafka `raw_events` topic болон Session service рүү дамжуулдаг.

Session service нь Redis-д `session:{session_id}` hash болон deadline sorted set ашиглан session aggregation хийдэг. Session state нь `NEW`, `ACTIVE`, `ABANDONED`, `CONVERTED` гэсэн төлөвтэй. Purchase success илэрвэл session `CONVERTED` terminal төлөвт шилжиж, timeout үед дахин `ABANDONED` болохоос хамгаалагдсан. Timeout эсвэл final event-ийн дараа session өгөгдлийг PostgreSQL `sessions.sessions` хүснэгтэд хадгалж, Kafka `session_enriched` topic руу илгээдэг.

Feature service нь `session_enriched` message-ийг авч 76 талбартай `FeatureSet` үүсгэдэг. Үүнд active time, page duration, click count, scroll depth, rage click, back navigation, checkout step, cart value, coupon/discount, device type, referrer, product count, mouse movement, trust barrier, price hesitation зэрэг behavioral feature-үүд орсон. Missing утгыг default утгаар нөхөж, NaN/Inf утгыг `0.0` болгон тогтворжуулсан.

ML service нь `feature_ready` topic-оос feature vector авч XGBoost model ашиглан abandonment probability тооцдог. Active inference path нь XGBoost-only байна. LSTM class код хэлбэрээр байгаа боловч pipeline-д ашиглагдаагүй бөгөөд `future_work_disabled` гэж тэмдэглэгдсэн. SHAP боломжтой үед top feature contribution тооцож, prediction payload-ийг `prediction_done` болон `prediction_done_v2` topic руу илгээдэг.

Main service нь `prediction_done` topic-ийг consumer command-аар уншиж, session, prediction, diagnosis, recommendation өгөгдлийг Django model-ууд руу хадгалдаг. S1-S7 оношлогоо нь deterministic rule-based scorer-аар хэрэгжсэн. S1 нь psychological hesitation, S2 technical friction, S3 trust issue, S4 mobile usability issue, S5 price sensitivity, S6 indecision/navigation disorder, S7 external influence/referral effect гэсэн утгатай. Dominant reason нь хамгийн өндөр оноотой S score-оор тодорхойлогддог. Purchase success эсвэл `CONVERTED` session дээр abandonment diagnosis/recommendation үүсгэхгүй байх хамгаалалт хэрэгжсэн.

Recommendation generation нь Gemini API ашиглах боломжтойгоор хэрэгжсэн боловч API key байхгүй эсвэл Gemini алдаа өгсөн үед deterministic fallback JSON үүсгэдэг. Gemini prompt нь Mongolian business-friendly text шаардаж байгаа боловч fallback text нь англи хэл дээр байгаа тул recommendation-ийн Mongolian language support хэсэгчлэн хэрэгжсэн гэж үзнэ.

Frontend implementation нь `cart_analytic` Next.js dashboard болон `sneaker-store` demo ecommerce app-аас бүрдэнэ. Dashboard нь analytics overview, sessions, diagnosis, recommendations, installation snippet, pipeline/ML insights, settings болон auth pages-тэй. Demo shop нь Prisma/NextAuth ашиглаж, cart болон checkout event-үүдийг Observer snippet-д `data-ca-*` attribute болон `window._ca_user`-ээр дамжуулдаг.

Testing/validation хэсэгт Django, Observer, Session, Feature, ML service тус бүр pytest test-тэй. S1-S7 scoring, API key tier filtering, session terminal state, Redis TTL/flush behavior, feature vector structure, XGBoost-only prediction contract, Kafka producer retry зэрэг гол хэсгүүд test-ээр баталгаажсан. Full test suite энэ report үүсгэх үед дахин ажиллуулаагүй боловч repository дотор өмнөх audit evidence файлд pass үр дүн хадгалагдсан байна.

## 16. Material For Conclusion

- Системийн туршилтын хувилбар нь ecommerce event collection, sessionization, feature engineering, ML prediction, S1-S7 diagnosis, recommendation, dashboard visualization гэсэн end-to-end урсгалыг хэрэгжүүлсэн.
- Docker Compose орчинд PostgreSQL, Redis, Kafka болон backend/frontend service-үүдийг нэгтгэн ажиллуулах тохиргоо хийгдсэн.
- Observer snippet нь хэрэглэгчийн browser-side behavior event-үүдийг цуглуулж, tier-based field filtering болон sensitive key stripping хийдэг.
- Redis sessionization нь session төлөв, TTL, duplicate event guard, converted terminal state хамгаалалттай хэрэгжсэн.
- ML prediction нь XGBoost model дээр идэвхтэй ажиллаж байгаа; SHAP explanation боломжтой.
- S1-S7 abandoned-cart reason scoring нь deterministic rule-based байдлаар хэрэгжсэн.
- Gemini recommendation generation боломжтой боловч fallback rule-based recommendation заавал ажиллах байдлаар хэрэгжсэн.
- Dashboard нь analytics, diagnosis, recommendations, session detail, Observer installation зэрэг thesis demo-д шаардлагатай UI-г харуулдаг.
- Test suite нь scoring, feature vector, API key filtering, session behavior, prediction contract зэрэг гол logic-ийг шалгадаг.
- Хязгаарлалт: LSTM active inference биш; VG/HVG service Compose pipeline-д бүрэн холбогдоогүй; Observer active API key validation Django hashed key table-тэй шууд холбогдоогүй; fallback recommendation Mongolian биш.
- Цаашид хийх ажил: real production dataset-аар model validation хийх, Observer API key-tenant binding-ийг хатуу болгох, `prediction_done_v2` consumer нэмэх, VG/HVG pipeline-г Docker/data flow-д бүрэн холбох, fallback recommendation-ийг Mongolian болгох.

## 17. Evidence Snippets

### Docker Topics

File: `docker-compose.yml`

```yaml
kafka_topics --bootstrap-server kafka:9092 --create --if-not-exists --topic raw_events --partitions 1 --replication-factor 1
kafka_topics --bootstrap-server kafka:9092 --create --if-not-exists --topic session_enriched --partitions 1 --replication-factor 1
kafka_topics --bootstrap-server kafka:9092 --create --if-not-exists --topic feature_ready --partitions 1 --replication-factor 1
kafka_topics --bootstrap-server kafka:9092 --create --if-not-exists --topic prediction_done --partitions 1 --replication-factor 1
kafka_topics --bootstrap-server kafka:9092 --create --if-not-exists --topic prediction_done_v2 --partitions 1 --replication-factor 1
```

### Observer Ingest

File: `observer_experiment/observer/main.py`, function `_ingest`

```python
key = extract_api_key(request, data)
tier = resolve_tier_for_key(key)
if not tier:
    raise HTTPException(status_code=401, detail="Missing or invalid API key...")
data.pop("api_key", None)
data["ip"] = request.client.host if request.client else "unknown"
data["user_agent"] = request.headers.get("user-agent", "")
data["tier"] = tier
payload_obj = EventPayload(**data)
filtered = payload_obj.to_ingest_dict()
event_id = await save_event(filtered, tier=tier)
```

### Tier Filtering

File: `observer_experiment/observer/models/event.py`, function `filter_payload_for_tier`

```python
FORBIDDEN_KEYS = frozenset({"api_key", "authorization", "password", "token", "secret"})

def filter_payload_for_tier(data: dict[str, Any], tier: str) -> dict[str, Any]:
    allowed = allowed_keys_for_tier(tier)
    normalized = normalize_incoming_keys(data)
    result: dict[str, Any] = {}
    for k, v in normalized.items():
        if k in CORE_DB_KEYS:
            result[k] = v
        elif k in allowed:
            result[k] = v
```

### API Key Hashing

File: `main_service/apps/tenants/models.py`, class `APIKey`

```python
@classmethod
def generate_raw_key(cls, tier: str, suffix_len: int = 12) -> tuple[str, str]:
    prefix = cls._prefix_for_tier(tier)
    byte_len = (suffix_len + 1) // 2
    suffix = secrets.token_hex(byte_len)[:suffix_len]
    raw_key = f'{prefix}{suffix}'
    digest = hashlib.sha256(raw_key.encode('utf-8')).hexdigest()
    return raw_key, digest
```

### Session States

File: `session/session/app/models.py`, class `SessionState`

```python
class SessionState(StrEnum):
    NEW = "NEW"
    ACTIVE = "ACTIVE"
    ABANDONED = "ABANDONED"
    CONVERTED = "CONVERTED"
```

### Session Aggregation

File: `session/session/app/assembler.py`, function `accumulate_event`

```python
if is_new_session:
    pipe.hset(key, mapping={
        "session_id": str(event.session_id),
        "visitor_id": str(event.visitor_id),
        "tenant_id": str(event.tenant_id),
        "started_at": event.timestamp.isoformat(),
        "event_count": "0",
        "state": SessionState.NEW.value,
    })
```

### Abandoned Flush

File: `session/session/app/assembler.py`, function `flush_session`

```python
if session_data.get("state") != SessionState.CONVERTED.value:
    session_data["state"] = SessionState.ABANDONED.value
    await r.hset(key, mapping={"state": SessionState.ABANDONED.value})

await write_session_to_pg(session_data)
await emit_session_enriched(session_data, window_seconds=None)
```

### Feature Vector Contract

File: `feature/feature_svc/models.py`, class `FeatureVector`

```python
class FeatureVector(BaseModel):
    session_id: UUID
    tenant_id: UUID
    version: str
    variant: Literal["A", "B", "C", "D"] = "C"
    features: FeatureSet
    computed_at: datetime
    window_seconds: int | None = None
    session_state: str = "NEW"
```

### Feature Count Guard

File: `feature/feature_svc/features/__init__.py`

```python
FEATURE_FIELD_NAMES = tuple(FeatureSet.model_fields.keys())
EXPECTED_FEATURE_COUNT = 76

if len(payload) != EXPECTED_FEATURE_COUNT:
    raise ValueError(
        f"Feature count mismatch: expected {EXPECTED_FEATURE_COUNT}, got {len(payload)}"
    )
```

### XGBoost Prediction

File: `ml/app/pipeline.py`, class `PredictionPipeline`

```python
xgb_score, shap_values = await self._run_xgb(fv.features)
final_score = max(0.0, min(1.0, xgb_score))
threshold = self.xgb.threshold
predicted_class = (
    PredictedClass.abandoned
    if final_score >= threshold
    else PredictedClass.converted
)
```

### SHAP Handling

File: `ml/app/xgboost_model.py`, method `predict_with_shap`

```python
score = float(self.model.predict_proba(X)[0][1])
shap_dict: dict[str, float] = {}
if self.explainer is not None and settings.shap_enabled:
    shap_values: Any = self.explainer.shap_values(X)
    shap_dict = {name: float(v) for name, v in zip(self.feature_names, shap_row)}
```

### S1-S7 Dominant Reason

File: `main_service/apps/analytics/s1_s7.py`, function `calculate_s1_s7`

```python
scores = {
    "S1": s1, "S2": s2, "S3": s3, "S4": s4,
    "S5": s5, "S6": s6, "S7": s7,
}
dominant_reason = max(scores, key=lambda key: scores[key])
info = REASON_INFO[dominant_reason]
return {**scores, "dominant_reason": dominant_reason, "reason_label": info.label}
```

### Converted Guard

File: `main_service/apps/analytics/prediction_pipeline.py`, function `should_create_abandonment_diagnosis`

```python
if session_state == "CONVERTED":
    return False, "session_state is CONVERTED"
if has_purchase_success:
    return False, "payload has_purchase_success is true"
if {"purchase_success", "order_success"} & raw_event_types:
    return False, "purchase_success/order_success exists in raw events"
```

### Recommendation Fallback

File: `main_service/apps/analytics/gemini_client.py`, function `generate_structured_recommendation`

```python
fallback = fallback_structured_recommendation(
    dominant_reason=dominant_reason,
    reason_label=reason_label,
    scores=scores,
    probability=probability,
)
api_key = getattr(settings, "GEMINI_API_KEY", "") or ""
if not api_key:
    return fallback
```

### Dashboard API Client

File: `cart_analytic/src/lib/api-client.ts`, function `buildHeaders`

```ts
if ((cfg.authMode === "jwt" || cfg.authMode === "both") && jwt) {
  headers.set("Authorization", `Bearer ${jwt}`);
}
if ((cfg.authMode === "api-key" || cfg.authMode === "both") && cfg.apiKey) {
  headers.set("X-API-Key", cfg.apiKey);
}
```

### Demo Store Snippet Install

File: `sneaker-store/src/app/layout.tsx`

```tsx
<Script id="observer-config" strategy="beforeInteractive">
  {`window.__OBSERVER_BASE__=${JSON.stringify(OBSERVER_URL)};window.__OBSERVER_API_KEY__=${JSON.stringify(OBSERVER_SNIPPET_KEY)};`}
</Script>
<Script
  src={`${OBSERVER_URL}/static/snippet/track.js?key=${encodeURIComponent(OBSERVER_SNIPPET_KEY)}`}
  strategy="afterInteractive"
/>
```

## 18. Final Output Format

Generated files:

- `CODEBASE_CONTEXT_FOR_CHATGPT.md`
- `REPO_FILE_TREE.txt`

Recommended files/folders to upload/share with ChatGPT:

1. `CODEBASE_CONTEXT_FOR_CHATGPT.md`
2. `REPO_FILE_TREE.txt`
3. `docker-compose.yml`
4. Database migrations/models:
   - `main_service/apps/analytics/models.py`
   - `main_service/apps/analytics/migrations/`
   - `main_service/apps/tenants/models.py`
   - `main_service/apps/tenants/migrations/`
   - `observer_experiment/observer/database.py`
   - `session/session/app/db.py`
   - `ml/app/db.py`
   - `sneaker-store/prisma/schema.prisma`
5. Service source folders if needed:
   - `observer_experiment/observer/`
   - `session/session/app/`
   - `feature/feature_svc/`
   - `ml/app/`
   - `main_service/apps/`
   - `cart_analytic/src/`
   - `sneaker-store/src/`
6. Tests:
   - `main_service/apps/**/tests.py`
   - `main_service/apps/analytics/test_s1_s7.py`
   - `observer_experiment/tests/`
   - `session/session/tests/`
   - `feature/feature_svc/tests/`
   - `ml/tests/`
   - `scripts/e2e_mvp.py`
   - `scripts/audit/e2e_three_use_cases.py`
