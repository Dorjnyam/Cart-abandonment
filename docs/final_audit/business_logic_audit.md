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
