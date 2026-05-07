# Thesis Claim Patch

## Claim Alignment Table

| Thesis section/page | Current claim | New safe claim | Reason |
|---|---|---|---|
| Architecture | The whole multi-service Kafka architecture is implemented and operational. | The MVP implements the planned services and Kafka topics; full runtime is accepted only after Docker and E2E verification pass. | Compose config passes, but final runtime/E2E was blocked by Docker Desktop failure. |
| ML model | XGBoost and LSTM are implemented models. | XGBoost is the active implemented model; LSTM is future work. | No trained/evaluated LSTM artifact is used in inference. |
| ML result | F1 is about 0.81. | XGBoost achieved F1 = 0.8279 on a balanced synthetic/simulated dataset of 1200 sessions. | Metrics are reproducible from `ml/models/metrics_xgboost.json`; dataset is synthetic. |
| Dataset | The dataset represents real ecommerce users. | The MVP uses a controlled synthetic session dataset; real/public validation is future or optional external validation. | No verified real thesis dataset is currently used for the reported metric. |
| SHAP | SHAP fully explains every prediction. | The ML service returns modest top-feature explanation data; SHAP/explainability is partial. | Top-feature support exists, but full dashboard/business SHAP explanation is not fully proven. |
| S1-S7 | The system calculates seven abandonment reason scores. | The Main service calculates canonical normalized S1-S7 scores and dominant reason from feature inputs. | Canonical scoring module and tests exist. |
| Gemini | Recommendations are generated with Gemini. | Recommendations use Gemini when configured and a deterministic fallback when Gemini is unavailable. | This is safer and matches MVP behavior without requiring a live API key. |
| Dashboard | Dashboard displays analytics and diagnosis. | Dashboard maps Main API data and must not use fake fallback unless explicitly enabled by `NEXT_PUBLIC_MOCK_FALLBACK=true`. | Hardcoded dominant reason was removed from active data mapping. |
| Demo ecommerce | Demo shop supports thesis scenarios. | Demo shop includes deterministic abandoned and converted session generation for defense. | Demo panel sends controlled event sequences. |
| Tenant isolation | Complete multi-tenant isolation is implemented. | Tenant isolation is demo-level/partial: a propagated demo tenant UUID is used, but production-grade isolation is future work. | Full cross-service authorization/isolation audit is not complete. |
| Performance | p95 latency and uptime targets are satisfied. | Performance targets are design goals, not measured claims, unless separate load tests are added. | No accepted load/performance evidence. |
| Security | Secrets are safe. | Real `.env` files are ignored and examples are placeholders; any previously committed real secrets must be rotated. | Working tree has examples only, but historical exposure still requires rotation. |

## Replacement Paragraphs

### Dataset Description

For MVP validation, the system uses a controlled synthetic session dataset with 1200 ecommerce sessions. The dataset is balanced: 600 sessions represent cart abandonment and 600 sessions represent successful purchase conversion. Each row describes behavior before the final session outcome using features aligned with the implemented feature service, such as cart activity, checkout friction, mobile usage, navigation behavior, price hesitation, referrer indicators, and technical error signals. The label is defined as `1` for abandoned checkout/session and `0` for converted `purchase_success`. Because the dataset is simulated, the result should be interpreted as controlled MVP validation rather than proof on real customer behavior.

### ML Training And Evaluation

The active prediction model in the MVP is XGBoost. Training is reproducible with `python ml/scripts/train.py --dataset data/sessions.csv --output ml/models/xgb_cart_abandonment.joblib`. The script uses a fixed random seed of 42, a stratified train/validation/test split, and compares majority baseline, logistic regression, and XGBoost. On the synthetic test set, XGBoost achieved accuracy = 0.8250, precision = 0.8145, recall = 0.8417, F1 = 0.8279, ROC-AUC = 0.8413, and PR-AUC = 0.7790. The confusion matrix was TN = 97, FP = 23, FN = 19, TP = 101. These metrics must be reported as simulated-dataset results.

### LSTM Future Work

LSTM was considered as a possible sequence-modeling extension for analyzing event order and temporal behavior. However, the MVP does not use LSTM as an active inference model because no reproducible LSTM training pipeline, evaluation result, or deployed model artifact is included. Future work should train an LSTM on real or public session-sequence data and compare it against the XGBoost baseline using the same split and metrics.

### System Testing

The rescued MVP includes unit and service-level tests for the Python services, plus dashboard and demo frontend build/lint checks. Verified results include passing tests for Main, Observer, Session, Feature, and ML services, and successful dashboard/demo builds. Docker Compose configuration validates successfully. Final end-to-end acceptance requires rerunning the full Docker stack and proving both abandoned and converted event flows from Observer through Kafka, ML prediction, Main diagnosis, and Dashboard display.

### Limitations

The current MVP has several limitations. The ML result is based on synthetic data and should not be generalized to real customers without external validation. SHAP/top-feature explanations are modest and should be described as explanatory support, not a complete causal explanation. Tenant isolation is suitable for a single demo tenant but is not a production-grade multi-tenant security proof. Production latency, uptime, and scalability claims are not supported unless measured by separate load tests. Real secrets that may have existed in earlier `.env` files must be rotated.

### Conclusion

The MVP demonstrates the core thesis workflow: ecommerce behavior events are collected, processed through service stages, transformed into features, scored by an XGBoost abandonment model, diagnosed with S1-S7 reason scores, and exposed to an analytics dashboard with recommendations. The implementation is suitable as a thesis demonstration once Docker runtime and E2E flow verification pass. The thesis should present XGBoost, S1-S7, dashboard, and deterministic demo functionality as implemented, while moving LSTM, production-scale performance, and full security hardening to future work.
