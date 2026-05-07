# Docker Runtime Check

| Service | Container status | Health status | Port | Logs | Pass/Fail |
|---------|------------------|---------------|------|------|-----------|
| PostgreSQL | Up healthy | Docker healthy | 5432 | `docker_compose_ps.txt` | PASS |
| Redis | Up healthy | Docker healthy | 6379 | `docker_compose_ps.txt` | PASS |
| Kafka | Up healthy | Docker healthy | 9092 | `docker_compose_ps.txt` | PASS |
| Main service | Up healthy | `/api/health/` 200 status ok | 8000 | `health_main.txt` | PASS partial: MinIO failed in dependency details |
| Main prediction consumer | Up | No HTTP health | n/a | `docker_logs_after_e2e.txt` | FAIL for UC1 missed prediction |
| Observer | Up healthy | `/health` 200 | 8001 | `health_observer.txt` | PASS |
| Session | Up healthy | `/health` 200 | 8002 | `health_session.txt` | PASS |
| Feature | Up healthy | `/health` 200 | 8003 | `health_feature.txt` | PASS |
| ML | Up healthy | `/health` 200 model loaded | 8004 | `health_ml.txt` | PASS |
| Dashboard | Up | HTTP 307 to `/login` | 3001 | `dashboard_http.txt` | PASS |
| Demo ecommerce | Up | HTTP 200 | 3000 | `demo_http.txt` | PASS |

Docker engine and compose worked. Runtime verification was not blocked by Docker; it failed at application pipeline behavior.
