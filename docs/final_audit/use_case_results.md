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
