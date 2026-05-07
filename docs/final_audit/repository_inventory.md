# Repository Inventory

| Area | Path | Exists? | Main files | Status | Notes |
|------|------|---------|------------|--------|-------|
| Main service | `main_service` | yes | .claude, .env.example, .gitignore, .vscode, analytics.duckdb, apps, conftest.py, data, db.sqlite3, docker-compose.main-only.yml, docker-compose.yml, Dockerfile | present | static discovery |
| Observer service | `observer_experiment` | yes | .claude, .dockerignore, .env.example, .gitignore, .vscode, database.py, docker-compose.redis.yml, docker-compose.yml, Dockerfile, docs, documentation, integration | present | static discovery |
| Session service | `session/session` | yes | .env.example, app, celery_app.py, docker-compose.yml, Dockerfile, migrations, pytest.ini, README.md, requirements.txt, tests | present | static discovery |
| Feature service | `feature/feature_svc` | yes | .claude, .dockerignore, .env.example, .gitignore, config.py, docker-compose.yaml, Dockerfile, features, kafka_consumer.py, kafka_producer.py, main.py, models.py | present | static discovery |
| ML service | `ml` | yes | .claude, .dockerignore, .env.example, .gitignore, .vscode, app, docker-compose.yaml, Dockerfile, models, pytest.ini, requirements.txt, scripts | present | static discovery |
| Analytics dashboard | `cart_analytic` | yes | .claude, .dockerignore, .env.example, .env.local.example, .gitignore, AGENTS.md, CLAUDE.md, DESIGN_BORDER_LITE_SPEC.md, Dockerfile, eslint.config.mjs, next-env.d.ts, next.config.ts | present | static discovery |
| Demo ecommerce | `sneaker-store` | yes | .dockerignore, .env.example, .gitignore, components, DESIGN.md, Dockerfile, docs, eslint.config.mjs, next-env.d.ts, next.config.ts, package-lock.json, package.json | present | static discovery |
| Docs | `docs` | yes | defense_evidence, final_audit, thesis_claim_patch.md | present | static discovery |
| Root scripts | `scripts` | yes | audit, e2e_mvp.py | present | static discovery |

## Package And Runtime Files
- `**/package.json`: 4
  - `cart-analytics-docusaurus/cart-analytics-docs/package.json`
  - `cart_analytic/package.json`
  - `observer_experiment/website/package.json`
  - `sneaker-store/package.json`
- `**/requirements*.txt`: 6
  - `feature/feature_svc/requirements.txt`
  - `main_service/requirements.txt`
  - `ml/requirements.txt`
  - `observer_experiment/integration/requirements-consumer.txt`
  - `observer_experiment/requirements.txt`
  - `session/session/requirements.txt`
- `**/pyproject.toml`: 0
- `**/Dockerfile`: 7
  - `cart_analytic/Dockerfile`
  - `feature/feature_svc/Dockerfile`
  - `main_service/Dockerfile`
  - `ml/Dockerfile`
  - `observer_experiment/Dockerfile`
  - `session/session/Dockerfile`
  - `sneaker-store/Dockerfile`
- `**/docker-compose*.yml`: 6
  - `docker-compose.yml`
  - `main_service/docker-compose.main-only.yml`
  - `main_service/docker-compose.yml`
  - `observer_experiment/docker-compose.redis.yml`
  - `observer_experiment/docker-compose.yml`
  - `session/session/docker-compose.yml`
- `**/docker-compose*.yaml`: 2
  - `feature/feature_svc/docker-compose.yaml`
  - `ml/docker-compose.yaml`
- `**/.env.example`: 8
  - `.env.example`
  - `cart_analytic/.env.example`
  - `feature/feature_svc/.env.example`
  - `main_service/.env.example`
  - `ml/.env.example`
  - `observer_experiment/.env.example`
  - `session/session/.env.example`
  - `sneaker-store/.env.example`
- `**/pytest.ini`: 5
  - `feature/feature_svc/pytest.ini`
  - `main_service/pytest.ini`
  - `ml/pytest.ini`
  - `observer_experiment/pytest.ini`
  - `session/session/pytest.ini`
- `**/README.md`: 14
  - `README.md`
  - `cart-analytics-docusaurus/cart-analytics-docs/README.md`
  - `cart_analytic/README.md`
  - `docs/defense_evidence/README.md`
  - `feature/feature_svc/schemas/README.md`
  - `main_service/README.md`
  - `main_service/vg_service/README.md`
  - `observer_experiment/README.md`
  - `observer_experiment/docs/integration/README.md`
  - `observer_experiment/documentation/README.md`
  - `observer_experiment/integration/README.md`
  - `observer_experiment/website/README.md`
  - `session/session/README.md`
  - `sneaker-store/README.md`
