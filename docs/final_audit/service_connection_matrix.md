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
