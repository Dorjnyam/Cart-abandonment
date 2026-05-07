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
