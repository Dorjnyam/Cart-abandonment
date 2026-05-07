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
