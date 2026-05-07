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
