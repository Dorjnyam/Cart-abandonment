# Defense Evidence Package

## How The System Was Started

Use the root compose file from the repository root:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Stop and clear runtime volumes with:

```powershell
docker compose down -v
```

Current verification note: `docker compose config --quiet` passes. Full runtime verification is still blocked because Docker Desktop returns an engine API 500 error and `com.docker.service` remains stopped from this non-elevated shell. Restart Docker Desktop from the Windows UI or an elevated shell, then rerun the commands above.

## Abandoned Session Generation

Use either the demo shop or the E2E script.

Demo shop:

```text
http://localhost:3000
```

Click **Generate abandoned session** in the Thesis Demo Mode panel. The flow sends:

```text
page_view -> product_view -> add_to_cart -> cart_view -> checkout_start -> checkout_error -> abandon_checkout
```

Script:

```powershell
python scripts/e2e_mvp.py --base-url http://localhost:8001 --main-url http://localhost:8000 --timeout 180
```

## Converted Session Generation

In the demo shop, click **Generate converted session**. The flow sends:

```text
page_view -> product_view -> add_to_cart -> cart_view -> checkout_start -> purchase_success
```

The E2E script also sends this converted flow after the abandoned flow.

## ML Metrics Source

The metrics in this folder are copied from:

```text
ml/models/metrics_xgboost.json
ml/models/confusion_matrix.json
```

They are reproduced by:

```powershell
python ml/scripts/train.py --dataset data/sessions.csv --output ml/models/xgb_cart_abandonment.joblib
```

Dataset summary:

```text
1200 synthetic sessions
600 abandoned sessions
600 converted sessions
Stratified train/validation/test split with random_state=42
```

## What Is Synthetic Or Simulated

The ML dataset is synthetic/simulated and is intended for controlled MVP validation. It must not be described as real customer behavior. The safe thesis claim is that XGBoost reached F1 = 0.8279 on a balanced simulated dataset.

## Implemented

- Root full-stack Docker Compose configuration.
- Observer event ingestion with API key validation and raw event storage.
- Kafka topic flow: `raw_events`, `session_enriched`, `feature_ready`, `prediction_done`.
- Session grouping and abandoned/converted labeling.
- Stable feature vector generation.
- XGBoost training, evaluation, artifact saving, and inference contract.
- Partial SHAP/top-feature explanation.
- Canonical S1-S7 diagnosis scoring in Main service.
- Gemini recommendation with fallback text.
- Dashboard data mapping without hardcoded dominant reason.
- Demo ecommerce deterministic thesis panel.

## Pending Runtime Evidence

The latest command outputs are saved in this folder:

```text
docker_version.txt
docker_compose_version.txt
docker_compose_down_v.txt
docker_compose_config.txt
docker_compose_up_build_d.txt
docker_compose_ps.txt
health_main.txt
health_observer.txt
health_session.txt
health_feature.txt
health_ml.txt
demo_http.txt
dashboard_http.txt
e2e_mvp_output.txt
```

The E2E script currently cannot prove the flow because Main at `localhost:8000` times out after Docker Desktop failed. This is a runtime environment blocker, not a new application feature request.

## Future Work

- LSTM sequence model training/evaluation.
- External validation on Kaggle/public clickstream data.
- Production-grade tenant isolation audit.
- Measured latency/SLO claims.
- Security hardening beyond MVP cleanup.
- Screenshot capture after Docker runtime is recovered.
