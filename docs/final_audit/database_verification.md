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
