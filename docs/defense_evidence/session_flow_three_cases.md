# Three Session Flow Evidence

Generated from `python scripts/audit/e2e_three_use_cases.py` on 2026-05-13.

Final result: `PASS`

Full raw output:

- `docs/defense_evidence/e2e_three_use_cases_result.json`
- `docs/defense_evidence/uc1_abandoned_dashboard_api.json`
- `docs/defense_evidence/uc2_converted_dashboard_api.json`
- `docs/defense_evidence/uc3_price_sensitive_dashboard_api.json`

## Pipeline

1. Observer accepts raw ecommerce events at `/track`.
2. Session service aggregates those events into one `session_enriched` message.
3. Feature service turns the aggregate into the deterministic feature vector.
4. ML service runs XGBoost and publishes `prediction_done`.
5. Main service stores the prediction, applies business outcome rules, creates S1-S7 diagnosis for abandoned sessions, and creates a recommendation.
6. Dashboard reads from `/api/dashboard/sessions/{session_id}/` and `/api/dashboard/recommendations/`.

## Session 1: Technical Abandonment

- Original session: `audit_uc1_abandoned_technical`
- Canonical session: `ab892586-560d-5dcd-9bff-59751b8bbf79`
- Events: `page_view`, `product_view`, `add_to_cart`, `cart_view`, `checkout_start`, `checkout_error`, `checkout_error`, `abandon_checkout`
- Main state: `ABANDONED`
- ML class: `abandoned`
- Business outcome: `abandoned`
- Abandonment probability: `0.6992`
- S1-S7 scores: `S1=0.4375`, `S2=0.785`, `S3=0.3`, `S4=0.6717`, `S5=0.0996`, `S6=0.3667`, `S7=0.66`
- Dominant reason: `S2` (`Technical friction`)
- Recommendation: `Fix technical friction`
- Recommendation status after creation: `new`

What it means: this session became an abandoned checkout case. Main correctly created S1-S7 scores and a fallback recommendation because the dominant reason is technical friction.

## Session 2: Converted Purchase

- Original session: `audit_uc2_converted_purchase`
- Canonical session: `20df6d0e-d4e3-5e93-ae0f-9e64680dd6cd`
- Events: `page_view`, `product_view`, `add_to_cart`, `cart_view`, `checkout_start`, `purchase_success`
- Main state: `CONVERTED`
- ML class: `abandoned`
- Business outcome: `converted`
- Abandonment probability: `0.4757`
- Prediction override: `true`
- S1-S7 scores: intentionally `null`
- Recommendation: intentionally `null`

What it means: this session contains `purchase_success`, so Main protects the business truth and stores it as converted even if the ML output conflicts. S1-S7 and abandonment recommendations are skipped by design for converted sessions.

## Session 3: Price-Sensitive Abandonment

- Original session: `audit_uc3_price_sensitive_abandonment`
- Canonical session: `1df12141-e7f8-5b26-b150-53b602e9f8ef`
- Events: `page_view`, `product_view`, `add_to_cart`, `cart_view`, `checkout_start`, `cart_view`, `checkout_start`, `abandon_checkout`
- Main state: `ABANDONED`
- ML class: `abandoned`
- Business outcome: `abandoned`
- Abandonment probability: `0.6411`
- S1-S7 scores: `S1=0.35`, `S2=0.11`, `S3=0.2333`, `S4=0.0`, `S5=0.9`, `S6=0.25`, `S7=0.8`
- Dominant reason: `S5` (`Price sensitivity`)
- Recommendation: `Fix price sensitivity`
- Recommendation status after creation: `new`

What it means: this session became an abandoned checkout case. Main correctly created S1-S7 scores and a fallback recommendation because the dominant reason is price sensitivity.

## Important Interpretation

- Empty S1-S7 is correct only for converted sessions.
- Empty recommendation is correct only for converted sessions.
- Abandoned sessions should have both `diagnosis.scores` and `recommendation`.
- The session detail developer payload now includes `feature_vector`, `shap_values`, and `outcome_metadata` so future runs show the full Main-side input and output fields.
