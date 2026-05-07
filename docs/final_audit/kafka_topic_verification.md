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
