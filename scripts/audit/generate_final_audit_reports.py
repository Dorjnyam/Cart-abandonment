from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "final_audit"
EVID = ROOT / "docs" / "defense_evidence"


def write(name: str, body: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / name
    path.write_text(body.strip() + "\n", encoding="utf-8")
    print(path.relative_to(ROOT))


COMMON_EVIDENCE = """
Evidence files:
- `docs/defense_evidence/static_inventory.json`
- `docs/defense_evidence/audit_main_pytest.txt`
- `docs/defense_evidence/audit_observer_pytest.txt`
- `docs/defense_evidence/audit_session_pytest.txt`
- `docs/defense_evidence/audit_feature_pytest.txt`
- `docs/defense_evidence/audit_ml_pytest.txt`
- `docs/defense_evidence/audit_dashboard_lint.txt`
- `docs/defense_evidence/audit_dashboard_build.txt`
- `docs/defense_evidence/audit_demo_lint.txt`
- `docs/defense_evidence/audit_demo_build.txt`
- `docs/defense_evidence/docker_compose_ps.txt`
- `docs/defense_evidence/docker_logs_after_start.txt`
- `docs/defense_evidence/docker_logs_after_e2e.txt`
- `docs/defense_evidence/e2e_three_use_cases_output.txt`
- `docs/defense_evidence/e2e_three_use_cases_output.json`
- `docs/defense_evidence/db_raw_events_after_e2e.txt`
- `docs/defense_evidence/db_main_tables_after_e2e.txt`
- `docs/defense_evidence/kafka_topics_after_e2e.txt`
"""


def main() -> None:
    write("dead_code_and_duplicate_logic.md", """
# Dead Code And Duplicate Logic

| Area | Evidence | Status | Risk | Fix |
|------|----------|--------|------|-----|
| S1-S7 scoring | `main_service/apps/analytics/s1_s7.py::calculate_s1_s7`; wrappers in `apps/analytics/scoring.py`, `apps/diagnosis/scoring.py` | Canonical implementation exists in Main | Low, if wrappers remain compatibility-only | Keep `s1_s7.py` as the only formula owner and test wrappers against it |
| LSTM | `ml/app/pipeline.py::lstm_loaded` returns false; `ml/app/lstm_model.py` present | Future work only | Medium documentation risk | Thesis must say LSTM is not active |
| Dashboard diagnosis detail defaults | `cart_analytic/src/app/diagnosis/[id]/page.tsx` `DEFAULT_SCORES` | Static fallback exists | Medium: can show non-persisted scores in a detail view | Replace with empty/error state unless `NEXT_PUBLIC_MOCK_FALLBACK=true` |
| Dashboard pipeline mock | `cart_analytic/src/lib/services/pipeline.ts` catch returns `MOCK_PIPELINE` | Mock can appear after API failure | High for thesis demo honesty | Gate catch fallback behind `NEXT_PUBLIC_MOCK_FALLBACK=true` |
| Dashboard ML insights mock | `cart_analytic/src/lib/services/mlInsights.ts` catch returns `MOCK_INSIGHTS` | Mock can appear after API failure | High: includes production-looking dataset claim | Gate behind mock flag and remove production wording |
| Stale reason labels | `cart_analytic/src/lib/constants.ts`, `cart_analytic/src/app/diagnosis/page.tsx` blurbs | Some labels do not match canonical S1-S7 | Medium | Import one canonical label map |
| Stale ML docs | `observer_experiment/documentation/services/05-ml-prediction-service.md` | Claims XGBoost+LSTM ensemble | High thesis risk | Rewrite as XGBoost-only MVP and LSTM future work |

""")

    write("service_connection_matrix.md", """
# Service Connection Matrix

| From | To | Protocol | Endpoint/Topic | Payload | Status | Evidence | Gap |
|------|----|----------|----------------|---------|--------|----------|-----|
| Demo ecommerce | Observer | HTTP | `POST /track` | ecommerce event JSON with API key | PASS code, API method verified | `observer_experiment/observer/main.py`; `db_raw_events_after_e2e.txt` | Browser click path not executed |
| Observer | PostgreSQL | SQLAlchemy | `raw_events` table | raw event + payload JSON | PASS | 22 rows in `db_raw_events_after_e2e.txt` | Some commerce fields are dropped by schema |
| Observer | Kafka | aiokafka | `raw_events` | event payload | PASS | `kafka_topics_after_e2e.txt`; observer health | Need schema hardening |
| Session | Kafka | aiokafka | consumes `raw_events` | raw events | PASS partial | ML received all 3 sessions | Flush endpoint returned 404 for UC2/UC3 after automatic finalization |
| Session | Feature | Kafka | `session_enriched` | enriched session | PASS partial | ML runtime predicted 3 sessions | Main missed UC1 later |
| Feature | ML | Kafka | `feature_ready` | features + session | PASS | ML `/health` model loaded and predictions published | Feature output has more fields than ML uses; ML uses saved order |
| ML | Main | Kafka | `prediction_done` | prediction contract | FAIL | `docker_logs_after_e2e.txt`; `db_main_tables_after_e2e.txt` | Main consumer missed UC1 due topic assignment race |
| Main | Dashboard | HTTP | `/api/dashboard/*` | persisted predictions/diagnoses/recommendations | FAIL for UC1/UC2 business truth | UC1 detail 404; UC2 stored abandoned | Converted protection missing |

Critical runtime gap: `main_service/apps/analytics/management/commands/consume_prediction_done.py::Command.handle` started before `prediction_done` had partition metadata, received empty assignment, then reset to offset 1 and skipped UC1 offset 0.
""")

    write("event_contract_audit.md", """
# Event Contract Audit

| Event | Demo emits? | Observer accepts? | DB saved? | raw_events? | Session effect | Feature effect | ML effect | S1-S7 effect | Dashboard visible? | Gap |
|-------|-------------|-------------------|-----------|-------------|----------------|----------------|-----------|--------------|--------------------|-----|
| page_view | Yes | Yes | PASS | PASS | Starts session | page/time features | Indirect | S6/S7 context | UC1 no, UC2/UC3 persisted | UC1 lost after ML |
| product_view | Yes | Yes | PASS | PASS | Keeps active | product/category features | Indirect | S5/S6 | UC1 no, UC2/UC3 persisted | `product_name` not retained |
| add_to_cart | Yes | Yes | PASS | PASS | cart intent | cart features | Direct | S5/S6 | UC1 no, UC2/UC3 persisted | none |
| remove_from_cart | Code supports | Accepted | Not in use cases | Topic exists | cart reduction | cart features | Direct | S5/S6 | Not verified | Need deterministic UI event proof |
| cart_view | Yes | Yes | PASS | PASS | cart intent | cart repeat features | Direct | S5/S6 | UC1 no, UC2/UC3 persisted | none |
| checkout_start | Yes | Yes | PASS | PASS | checkout intent | checkout features | Direct | S2/S5 | UC1 no, UC2/UC3 persisted | none |
| checkout_error | Yes | Yes | PASS | PASS | friction signal | error features | Direct | S2/S4 | UC1 no | `error_type` not retained explicitly |
| abandon_checkout | Yes | Yes | PASS | PASS | abandoned terminal | abandonment features | Direct | all S1-S7 | UC3 persisted | UC1 not saved by Main |
| purchase_success | Yes | Yes | PASS | PASS | converted terminal expected | purchase signal | Direct | Should suppress abandonment | FAIL | UC2 treated as abandoned |

Schema result:
- Common fields are partially present: `event_type`, `session_id`, timestamp, path/page URL, API key, device/referrer/payload are supported.
- Tenant is preserved in payload during E2E: see `db_raw_events_after_e2e.txt`.
- Commerce fields are partial. `observer_experiment/observer/models/payload.py::EventPayload` includes product id/category/price, payment method, order total, discount code. It does not explicitly retain `product_name`, `shipping_cost`, `discount`, `error_type`, or `order_id` because unknown fields are ignored.
""")

    write("business_logic_audit.md", """
# Business Logic Audit

| Business rule | Code evidence | Test evidence | Pass/Fail | Gap | Severity | Fix suggestion |
|---------------|---------------|---------------|-----------|-----|----------|----------------|
| Invalid API key returns 401 and event is not stored | `observer_experiment/observer/main.py` API-key path | `audit_observer_pytest.txt` | PASS static/tests | E2E invalid key not rerun | Medium | Add E2E negative case |
| Inactive organization returns 403 | `main_service/apps/tenants/*`; observer tenant mapping | Static | PARTIAL | Runtime negative case not executed | Medium | Add inactive org test |
| Tenant isolation | Main tenant models/views; payload tenant preserved | DB payload tenant in raw events | PARTIAL | Dashboard only tested demo tenant | Medium | Add cross-tenant API test |
| New session starts on first event | `session/session/app/assembler.py` | Session tests | PASS | none | Low | Keep |
| Session becomes ACTIVE with multiple events | `assembler.py` | Session tests | PASS | none | Low | Keep |
| Session becomes ABANDONED without purchase | `assembler.py`, flush endpoint | UC3 DB diagnosis | PASS partial | UC1 missed after ML | High | Fix Main consumer race |
| Session becomes CONVERTED on purchase | `assembler.py::accumulate_event` | UC2 raw events | FAIL runtime | UC2 was persisted in Main as abandoned | Critical | Carry converted state and block abandoned recommendation |
| Converted session must not become abandoned afterward | `prediction_pipeline.py::handle_prediction_payload` | `db_main_tables_after_e2e.txt` | FAIL | Main trusts ML abandoned prediction | Critical | Main must honor converted session state |
| Feature vector avoids label leakage | `feature/feature_svc/features` | Static | PARTIAL | Needs training feature audit deeper | Medium | Document label fields excluded from ML order |
| ML uses exact training order | `ml/app/xgboost_model.py`, `ml/models/feature_order_xgboost.json` | ML tests and health | PASS | none | Low | Keep |
| S1-S7 normalized 0-1 | `main_service/apps/analytics/s1_s7.py` | Main pytest | PASS | none | Low | Keep |
| Dominant reason argmax | `s1_s7.py::dominant_reason` | Main pytest | PASS | none | Low | Keep |
| Recommendation after diagnosis | `prediction_pipeline.py::handle_prediction_payload` | UC2/UC3 DB rows | PASS partial | Wrongly created for converted UC2 | Critical | Suppress for converted sessions |
| Gemini failure fallback | `gemini_client.py::generate_structured_recommendation` | Main pytest; UC3 fallback text | PASS | none | Low | Keep |
| Dashboard displays persisted real data | `dashboard-mvp.ts` | UC1 404, UC2 wrong state | FAIL | UI cannot prove failed flows | High | Fix backend then rerun UI |
| Recommendation status update persists | Main analytics views | Static | PARTIAL | Runtime PATCH not executed | Medium | Add E2E PATCH assertion |
""")

    write("main_service_audit.md", """
# Main Service Audit

| Main area | Status | Evidence | Risk | Fix |
|-----------|--------|----------|------|-----|
| Django settings | PASS partial | `main_service/main_service/settings.py`; health 200 | Health reports MinIO invalid endpoint | Configure or remove MinIO dependency from readiness |
| Models | PASS static | `apps/analytics/models.py`, tenant models | Need more DB constraints for idempotency | Add unique constraints where needed |
| Prediction consumer | FAIL runtime | `consume_prediction_done.py::Command.handle`; `docker_logs_after_e2e.txt` | Missed first UC1 prediction on `prediction_done` | Pre-create topics/wait assignment/use earliest safely |
| Prediction pipeline | FAIL business rule | `prediction_pipeline.py::handle_prediction_payload`; UC2 DB | Converted purchase saved as abandoned diagnosis | Enforce converted state before diagnosis/recommendation |
| S1-S7 | PASS | `apps/analytics/s1_s7.py`; tests passed | UI labels may drift | Export/share canonical labels |
| Gemini/fallback | PASS | `apps/analytics/gemini_client.py`; DB recommendations | fallback source should be visible everywhere | Keep source field mapped |
| Dashboard APIs | PARTIAL | Main tests passed; dashboard API session detail 404 for UC1 | Cannot demo all use cases | Fix ingestion/prediction persistence |
| Auth/tenant filtering | PARTIAL | Demo login worked in audit script | Cross-tenant negative not executed | Add tenant-isolation E2E |
""")

    write("dashboard_audit.md", """
# Dashboard Audit

| Page/Component | API source | Real data? | Mock guarded? | S1-S7 correct? | Recommendation correct? | Status | Gap |
|----------------|------------|------------|---------------|----------------|-------------------------|--------|-----|
| Overview/dashboard | `dashboard-mvp.ts` Main API | Yes for core KPI path | Yes for MVP service | Labels from API | N/A | PASS static | Runtime UI not screenshot-verified |
| Sessions list | `dashboard-mvp.ts` | Yes | Yes | N/A | N/A | PASS static | UC1 missing from backend |
| Session detail | `/api/dashboard/sessions/:id/` | Yes if backend has row | Yes in MVP service | Uses API | Uses API | FAIL runtime for UC1 | UC1 404; UC2 wrong abandoned state |
| Diagnosis page | Main diagnosis API | Mostly yes | Mixed | Some stale local labels | N/A | PARTIAL | `REASON_BLURB` and constants drift |
| Diagnosis detail | local defaults/API mix | No guarantee | No | `DEFAULT_SCORES` static | Static feature rows | FAIL audit | Remove unguarded default scores |
| Recommendations | Main recommendations API | Yes core path | Yes in MVP service | N/A | Shows persisted source if mapped | PASS partial | Status PATCH not E2E verified |
| Integration/snippet | Main/API key services | Yes/static snippet | N/A | N/A | N/A | PASS static | Needs live snippet browser proof |
| Pipeline page/service | `pipeline.ts` | API then mock on error | FAIL | N/A | N/A | FAIL | Mock returned on API catch without env guard |
| ML insights | `mlInsights.ts` | API then mock on error | FAIL | N/A | N/A | FAIL | Mock has production-looking claims |

Dashboard cannot be defended as fully real-data complete until the backend E2E failures are fixed and normal-mode mock fallbacks are removed from auxiliary services.
""")

    write("ml_audit.md", """
# ML Audit

| ML item | Status | Evidence | Risk | Fix |
|---------|--------|----------|------|-----|
| Dataset | PASS with limitation | `ml/models/metrics_xgboost.json` says synthetic=true, rows=1200, abandoned=600, converted=600 | Not real customer data | Thesis wording must say synthetic/simulated MVP |
| Training reproducibility | PASS partial | `ml/scripts/train.py`; metrics artifact | Need rerun command recorded for defense | Add one-command training note |
| Metrics | PASS | accuracy 0.825, precision 0.814516, recall 0.841667, F1 0.827869, ROC-AUC 0.841319, PR-AUC 0.779040 | Synthetic only | Do not generalize |
| Artifact | PASS | `ml/models/xgboost_model.joblib`, feature order, metrics JSON | none | Keep versioned |
| Inference | PASS | ML health model_loaded true, feature_count 38 | UC2 high abandoned probability despite purchase | Add hard converted override/business feature |
| Kafka prediction | PASS | ML runtime published 3 predictions | Main missed UC1 | Fix Main/topic lifecycle |
| Top features/SHAP | PARTIAL | `top_features` emitted | Modest explanation, not full SHAP | Claim only top-feature explanation |
| LSTM | PASS as future work | `ml/app/pipeline.py` exposes future_work_disabled | Stale docs claim active ensemble | Rewrite docs |

| Model | Dataset | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|-------|---------|----------|-----------|--------|----|---------|--------|
| XGBoost | Synthetic/simulated MVP, 1200 rows, 600/600 | 0.825 | 0.814516 | 0.841667 | 0.827869 | 0.841319 | 0.779040 |
""")

    write("test_and_build_results.md", """
# Test And Build Results

| Component | Command | Result | Main failure | Fix suggestion |
|----------|---------|--------|--------------|----------------|
| Root | `docker compose config --quiet` | PASS | none | Keep |
| Main | `cd main_service; python -m pytest -q` | PASS, 27 passed | warnings only | Keep tests |
| Observer | `cd observer_experiment; python -m pytest -q` | PASS, 49 passed | none | Keep |
| Session | `cd session/session; python -m pytest -q` | PASS, 21 passed | none | Add converted E2E |
| Feature | `cd feature/feature_svc; python -m pytest -q` | PASS, 13 passed | none | Add contract E2E |
| ML | `cd ml; python -m pytest -q` | PASS, 7 passed | none | Add converted hard-case test |
| Dashboard | `cd cart_analytic; npm run lint` | PASS | none | Keep |
| Dashboard | `cd cart_analytic; npm run build` | PASS | none | Keep |
| Demo | `cd sneaker-store; npm run lint` | PASS with 9 warnings | warnings only | Clean later |
| Demo | `cd sneaker-store; npm run build` | PASS | none | Keep |
| Secret/mock search | `rg` searches | FINDINGS | mock fallbacks/stale docs/defaults | Fix before defense |

Evidence: `docs/defense_evidence/audit_*`.
""")

    write("docker_runtime_check.md", """
# Docker Runtime Check

| Service | Container status | Health status | Port | Logs | Pass/Fail |
|---------|------------------|---------------|------|------|-----------|
| PostgreSQL | Up healthy | Docker healthy | 5432 | `docker_compose_ps.txt` | PASS |
| Redis | Up healthy | Docker healthy | 6379 | `docker_compose_ps.txt` | PASS |
| Kafka | Up healthy | Docker healthy | 9092 | `docker_compose_ps.txt` | PASS |
| Main service | Up healthy | `/api/health/` 200 status ok | 8000 | `health_main.txt` | PASS partial: MinIO failed in dependency details |
| Main prediction consumer | Up | No HTTP health | n/a | `docker_logs_after_e2e.txt` | FAIL for UC1 missed prediction |
| Observer | Up healthy | `/health` 200 | 8001 | `health_observer.txt` | PASS |
| Session | Up healthy | `/health` 200 | 8002 | `health_session.txt` | PASS |
| Feature | Up healthy | `/health` 200 | 8003 | `health_feature.txt` | PASS |
| ML | Up healthy | `/health` 200 model loaded | 8004 | `health_ml.txt` | PASS |
| Dashboard | Up | HTTP 307 to `/login` | 3001 | `dashboard_http.txt` | PASS |
| Demo ecommerce | Up | HTTP 200 | 3000 | `demo_http.txt` | PASS |

Docker engine and compose worked. Runtime verification was not blocked by Docker; it failed at application pipeline behavior.
""")

    write("use_case_results.md", """
# Use Case Results

| Stage | UC1 abandoned technical | UC2 converted | UC3 price-sensitive | Evidence |
|-------|--------------------------|---------------|---------------------|----------|
| Events sent | PASS, 8 | PASS, 6 | PASS, 8 | `e2e_three_use_cases_output.txt` |
| Observer accepted | PASS | PASS | PASS | `db_raw_events_after_e2e.txt` |
| Raw events DB saved | PASS | PASS | PASS | 22 raw event rows |
| raw_events Kafka | PASS | PASS | PASS | `kafka_topics_after_e2e.txt` |
| Session state | PASS flush 200 | FAIL/unclear, flush 404 after purchase | FAIL/unclear flush 404 | E2E JSON |
| session_enriched Kafka | PASS inferred | PASS inferred | PASS inferred | ML predictions for all 3 |
| Feature vector | PASS inferred | PASS inferred | PASS inferred | ML runtime state |
| feature_ready Kafka | PASS inferred | PASS inferred | PASS inferred | ML predictions |
| ML prediction | PASS, score about 0.621 | PASS but wrong business outcome, score about 0.584 | PASS, score about 0.797 | ML runtime state |
| prediction_done Kafka | PASS produced | PASS produced | PASS produced | ML logs/runtime |
| Main prediction saved | FAIL | FAIL business rule | PASS | `db_main_tables_after_e2e.txt` |
| Diagnosis created | FAIL | FAIL business rule, created abandoned diagnosis | PASS, S5 | DB evidence |
| S1-S7 correct | BLOCKED | FAIL for converted flow | PASS for S5 | DB evidence |
| Recommendation created | FAIL | FAIL, abandoned recommendation for purchase | PASS | DB evidence |
| Dashboard API returns | FAIL 404 | BLOCKED by wrong canonical in script and wrong DB state | PARTIAL via DB, script blocked | E2E JSON |
| Dashboard UI shows | BLOCKED/not executed | BLOCKED/not executed | BLOCKED/not executed | Browser click path not available |

Verdict by use case:
- UC1: FAIL. ML predicted but Main did not persist due `prediction_done` topic/consumer startup race.
- UC2: FAIL. Purchase success became abandoned prediction/diagnosis/recommendation in Main.
- UC3: PASS for core backend pipeline and S5/fallback recommendation, but UI was not browser-verified.
""")

    write("database_verification.md", """
# Database Verification

| Table/Model | Expected record | Actual | Pass/Fail |
|-------------|-----------------|--------|-----------|
| Observer `raw_events` | 8 UC1 events | 8 rows with `audit_uc1_abandoned_technical` | PASS |
| Observer `raw_events` | 6 UC2 events | 6 rows with `audit_uc2_converted_purchase` including `purchase_success` | PASS |
| Observer `raw_events` | 8 UC3 events | 8 rows with `audit_uc3_price_sensitive_abandonment` | PASS |
| Main `analytics_session` | UC1 canonical session | Missing | FAIL |
| Main `analytics_session` | UC2 converted session | Present as session `20df6d0e-d4e3-5e93-ae0f-9e64680dd6cd` | FAIL business state |
| Main `analytics_session` | UC3 abandoned session | Present as session `1df12141-e7f8-5b26-b150-53b602e9f8ef` | PASS |
| Main `diagnosis` | UC1 S2/S4 diagnosis | Missing | FAIL |
| Main `diagnosis` | UC2 no abandoned-only diagnosis | Present with `predicted_class=abandoned`, dominant S3 | FAIL |
| Main `diagnosis` | UC3 S5 diagnosis | Present with dominant S5 | PASS |
| Main `recommendation` | UC1 checkout/mobile recommendation | Missing | FAIL |
| Main `recommendation` | UC2 no abandoned recommendation | Present | FAIL |
| Main `recommendation` | UC3 price recommendation | Present | PASS |

Evidence: `docs/defense_evidence/db_raw_events_after_e2e.txt`, `docs/defense_evidence/db_main_tables_after_e2e.txt`.
""")

    write("kafka_topic_verification.md", """
# Kafka Topic Verification

| Topic | Producer | Consumer | Message seen? | Schema valid? | Codec OK? | Gap |
|-------|----------|----------|---------------|---------------|-----------|-----|
| `raw_events` | Observer | Session | PASS inferred and topic exists | PASS partial | PASS | Need direct message schema capture |
| `session_enriched` | Session | Feature | PASS inferred and topic exists | PASS partial | PASS | Direct capture not saved |
| `feature_ready` | Feature | ML | PASS inferred and topic exists | PASS partial | PASS | Direct capture not saved |
| `prediction_done` | ML | Main | FAIL consumer reliability | PASS partial | PASS | Main missed UC1 offset 0 |
| `prediction_done_v2` | Existing topic | Unknown | Topic exists | Unknown | Unknown | Clarify legacy/current use |

Topic list evidence: `docs/defense_evidence/kafka_topics_after_e2e.txt`.
Consumer failure evidence: `docs/defense_evidence/docker_logs_after_e2e.txt`.
""")

    write("dashboard_business_demo_review.md", """
# Dashboard Business Demo Review

| Dashboard item | Expected | Actual | Pass/Fail | UX issue | Fix |
|----------------|----------|--------|-----------|----------|-----|
| How bad is abandonment? | Overview KPIs update from Main | Static code path real, runtime not visually verified | PARTIAL | Browser click screenshots missing | Verify after backend fix |
| Why is it happening? | S1-S7 bars with dominant reason | UC3 S5 exists; UC1 missing; UC2 wrong S3 abandoned | FAIL | Misleads examiner for converted flow | Fix backend outcome |
| Which sessions prove it? | Sessions can find UC1/UC2/UC3 | Main has only UC2/UC3 and UC2 is wrong | FAIL | Missing proof session | Fix consumer race |
| What did XGBoost predict? | Model version/probability visible | DB has UC2/UC3 probabilities | PARTIAL | UC1 absent | Fix persistence |
| Which S1-S7 reason is dominant? | S2/S4 for UC1, none abandoned for UC2, S5 for UC3 | UC1 missing, UC2 S3, UC3 S5 | FAIL | Contradicts use-case logic | Fix converted rule and consumer |
| Gemini/fallback recommendation | Present for abandoned sessions | UC3 present; UC2 wrongly present; UC1 missing | FAIL | Recommends action for a purchase | Suppress converted recommendation |
| Action for shop owner | Recommendation text/status | UC3 yes | PARTIAL | Status PATCH not tested | Add E2E PATCH test |
""")

    write("security_and_secrets_review.md", """
# Security And Secrets Review

| Secret/security issue | Evidence | Current safe? | Must rotate? | Severity | Fix |
|----------------------|----------|---------------|--------------|----------|-----|
| Tracked env examples | `git ls-files` found service `.env.example` files | Safe if placeholders only | No | Low | Keep examples placeholder-only |
| Demo API key/password defaults | `tk_full_demo_mvp`, `change-me-demo-password` in config/scripts | Safe only for local demo | Yes if ever deployed | Medium | Never use in public deployment |
| Build placeholder NextAuth secret | `cart_analytic/Dockerfile` | Safe placeholder if overridden | Yes for deployment | Medium | Require env at runtime |
| PostgreSQL default password | compose/env examples | Safe local only | Yes for deployment | Medium | Replace in deployed env |
| Gemini key | Search found no obvious real key pattern | Safe | No | Low | Keep untracked |
| CORS/auth | Settings and service configs | PARTIAL | n/a | Medium | Restrict origins outside demo |
| Tenant filtering | Main code supports tenant; E2E only demo tenant | PARTIAL | n/a | Medium | Add cross-tenant negative tests |
| Mock data exposure | dashboard auxiliary services | Unsafe for thesis normal mode | n/a | High | Gate every mock behind env flag |

Evidence: `docs/defense_evidence/audit_secret_search_refined.txt`, `git status --short` output from audit.
""")

    write("thesis_claim_alignment_final.md", """
# Thesis Claim Alignment Final

| Claim | Supported? | Evidence | Required thesis wording |
|-------|------------|----------|-------------------------|
| XGBoost prediction | Yes | ML health/model metrics | "The MVP uses XGBoost for prediction." |
| F1 around 0.81/0.8279 | Yes, synthetic only | `metrics_xgboost.json` | "F1=0.8279 on synthetic/simulated MVP data." |
| Synthetic/simulated dataset | Yes | metrics artifact | Must be explicit |
| LSTM | Future work only | `pipeline.py` disabled | Do not describe as active |
| SHAP/top features | Partial | top feature contract | Say modest top-feature explanation, not full SHAP pipeline |
| Kafka full pipeline | Not fully reliable | UC1 missed by Main | Claim implemented but E2E currently failing |
| Docker one-command startup | Starts | compose up/health evidence | Can claim stack starts locally; not READY |
| S1-S7 diagnosis | Implemented | `s1_s7.py`; UC3 S5 | Canonical Main implementation exists |
| Gemini recommendation | Partial | fallback and DB recs | Gemini/fallback implemented; Gemini live key not proven |
| Fallback recommendation | Yes | UC3 recommendation persisted | Safe |
| Dashboard real data | Partial/failing | UC1 404, UC2 wrong | Do not claim full verified dashboard demo |
| Demo deterministic flows | Partial | direct API script | Browser UI method not executed |
| Tenant isolation | Partial | code/static | Do not claim complete isolation proof |
| Performance/SLO claims | No | no load test | Do not claim |
| Security/secrets | Partial | search evidence | Local/demo safe only, not production security |
| Full production readiness | No | E2E failures | Must not claim |
""")

    write("FINAL_AUDIT_REPORT.md", """
# Final Audit Report

## Executive Summary

Final verdict: NOT READY.

The repository is close at code/build level: all discovered Python test suites passed, dashboard/demo builds passed, Docker Compose starts, and health endpoints respond. Runtime E2E is not ready. UC1 is lost after ML because Main misses the first `prediction_done` message during topic/consumer startup. UC2 purchase success is persisted by Main as an abandoned session with diagnosis/recommendation. That violates the thesis business rule that converted sessions must not become abandoned.

## What Was Verified

- Full repo inventory and function/component inventory were generated.
- Docker engine, compose, build, service startup, and HTTP health checks ran.
- Three deterministic API-based use cases were sent through Observer.
- PostgreSQL raw events, Main analytics tables, Kafka topic list, logs, tests, builds, and static search outputs were saved.

## What Failed

1. Main prediction consumer missed UC1 prediction from `prediction_done`.
2. Converted UC2 was saved as abandoned and received S3 diagnosis/recommendation.
3. Dashboard cannot prove UC1 and would show wrong business truth for UC2.
4. Auxiliary dashboard services can return mock data after API failure without `NEXT_PUBLIC_MOCK_FALLBACK=true`.
5. Event schema drops some required commerce fields.

## Environment Blockers

Docker was not a blocker. Browser UI click automation was not executed in this run; HTTP page checks passed.

## Service Readiness

| Service | Readiness |
|---------|-----------|
| Main | NOT READY due consumer race and converted-flow rule failure |
| Observer | ALMOST READY; stores raw events and publishes, schema gaps remain |
| Session | ALMOST READY; tests pass, but converted outcome contract needs stronger downstream protection |
| Feature | ALMOST READY; tests pass, contract should carry hard converted state |
| ML | ALMOST READY; XGBoost loads/predicts, but UC2 needs business override/contract |
| Dashboard | NOT READY for defense demo until backend truth and mock fallback issues are fixed |
| Demo ecommerce | ALMOST READY; builds, direct API path verified, browser click path not verified |

## 3 Use Case Results

| Use case | Result | Evidence |
|----------|--------|----------|
| UC1 abandoned technical/mobile | FAIL | raw events saved, ML predicted, Main missing, dashboard 404 |
| UC2 converted purchase | FAIL | `purchase_success` raw event saved, Main persisted abandoned S3 recommendation |
| UC3 price-sensitive abandonment | PASS backend core | Main persisted abandoned S5 recommendation |

## Remaining Blockers

- Fix `prediction_done` topic creation/consumer assignment race.
- Enforce converted session protection before diagnosis/recommendation.
- Remove normal-mode mock fallback from dashboard auxiliary pages.
- Align dashboard S1-S7 labels with Main.
- Expand Observer event schema for required commerce fields.
- Rewrite stale XGBoost+LSTM documentation.
- Add automated E2E tests for UC1, UC2, UC3 and recommendation status update.

## Exact Commands For Demo After Fix

```powershell
docker compose down -v
docker compose up --build -d
curl.exe http://localhost:8000/api/health/
curl.exe http://localhost:8001/health
curl.exe http://localhost:8002/health
curl.exe http://localhost:8003/health
curl.exe http://localhost:8004/health
python scripts/audit/e2e_three_use_cases.py
```

## Final Verdict

NOT READY
""")


if __name__ == "__main__":
    main()
