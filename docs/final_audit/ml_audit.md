# ML Audit

| ML item | Status | Evidence | Risk | Fix |
|---------|--------|----------|------|-----|
| Dataset | PASS with limitation | `ml/models/metrics_xgboost.json` says synthetic=true, rows=1200, abandoned=600, converted=600 | Not real customer data | Thesis wording must say synthetic/simulated MVP |
| Training reproducibility | PASS partial | `ml/scripts/train.py`; metrics artifact | Need rerun command recorded for defense | Add one-command training note |
| Metrics | PASS | accuracy 0.825, precision 0.814516, recall 0.841667, F1 0.827869, ROC-AUC 0.841319, PR-AUC 0.779040 | Synthetic only | Do not generalize |
| Artifact | PASS | `ml/models/xgboost_model.joblib`, feature order, metrics JSON | none | Keep versioned |
| Inference | PASS | ML health model_loaded true, feature_count 38 | UC2 high abandoned probability despite purchase | Add hard converted override/business feature |
| Kafka prediction | PASS | ML runtime published 3 predictions | Main missed UC1 | Fix Main/topic lifecycle |
| Top features/SHAP | PARTIAL | `top_features` emitted | Modest explanation, not full SHAP | Claim only top-feature explanation |
| LSTM | PASS as future work | `ml/app/pipeline.py` exposes future_work_disabled | Stale docs claim active ensemble | Rewrite docs |

| Model | Dataset | Accuracy | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|-------|---------|----------|-----------|--------|----|---------|--------|
| XGBoost | Synthetic/simulated MVP, 1200 rows, 600/600 | 0.825 | 0.814516 | 0.841667 | 0.827869 | 0.841319 | 0.779040 |
