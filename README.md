# Cart Abandonment Thesis MVP

## Thesis MVP full-stack run

This repository now targets a thesis-defense MVP, not a production-grade deployment.
The supported claim is XGBoost + SHAP-style feature explanations over a documented
synthetic/session-simulation dataset. LSTM, production SLOs, and complete
multi-tenant security are future work unless separately implemented and verified.

Start the MVP stack:

```bash
docker compose up --build
```

Stop and remove local volumes:

```bash
docker compose down -v
```

Generate the synthetic training dataset and train XGBoost:

```bash
python ml/scripts/generate_synthetic_sessions.py --output data/sessions.csv
python ml/scripts/train.py --dataset data/sessions.csv --output ml/models/xgb_cart_abandonment.joblib
```

Default local demo values:

- Dashboard: `http://localhost:3001`
- Demo ecommerce: `http://localhost:3000`
- Main API: `http://localhost:8000`
- Observer: `http://localhost:8001`
- Demo dashboard user: `demo@example.com`
- Demo dashboard password: `change-me-demo-password`
- Demo observer key: `tk_full_demo_mvp`

Real `.env` files must stay outside git. Rotate any database passwords, JWT/Django
secrets, Gemini keys, and observer/API keys that were previously committed.

---

Your System Architecture
The event pipeline is clean and event-driven:


Browser/SDK
  ↓ HTTP
Observer (8001) ─→ Kafka: raw_events
                         ↓
                   Session (8002) ─→ Kafka: session_enriched
                                            ↓
                                     Feature (8003) ─→ Kafka: feature_ready (?)
                                                              ↓
                                                       ML (8004) ─→ Kafka: prediction_done
                                                                           ↓
                                                                    Main Service (8000)
                                                                           ↓ REST
                                                                    Cart Analytics UI (3001)
This is a solid microservices + event-driven design for a cart abandonment analytics platform. Good instincts.

Critical Issues to Fix Before Production
1. PostgreSQL is missing from docker-compose
Every service references PostgreSQL but there's no postgres container. You must add one, or (better for prod) use a managed DB.

2. Django running with runserver — never use in production
Change main_service to use Gunicorn:


command: gunicorn main_service.wsgi:application --bind 0.0.0.0:8000 --workers 4
3. No Celery worker container
main_service uses Celery + Beat but no worker is defined in docker-compose. You need:


celery_worker:
  build: ./main_service
  command: celery -A main_service worker --loglevel=info
  depends_on: [redis, kafka]

celery_beat:
  build: ./main_service
  command: celery -A main_service beat --loglevel=info
  depends_on: [redis]
4. Hardcoded MinIO credentials in plain text
MINIO_ROOT_PASSWORD: password123 — move all secrets to .env files or a secrets manager.

5. Source code mounted as volumes in every service


volumes:
  - ./main_service:/app   # ← dev-only hot reload hack
Remove all of these for production. The Dockerfile should COPY the code at build time.

6. No health checks on any service
Kubernetes and Docker Compose both support healthcheck: — without them, orchestrators can't tell if a container is ready.

7. No API gateway or reverse proxy
All services are exposed on raw ports. You need Nginx or Traefik in front that routes by path/subdomain and handles SSL termination.

8. Kafka has a single broker with no replication
KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1 is fine for dev, but in prod you want at least 3 brokers for fault tolerance. This is why managed Kafka is better.

9. Missing Dockerfiles on some services
main_service, observer_experiment, and cart_analytic have no Dockerfile. You need them for proper image builds.

Should This Be on Kubernetes?
Yes, eventually — but not yet.

Your system has 6 services + 4 infra components (Kafka, Redis, MinIO, PostgreSQL). That's the right scale where Kubernetes pays off. But Kubernetes adds significant operational overhead, and right now your services have the dev-mode issues above.

Recommended path:

Phase 1 — Polish (now): Fix the issues above, write proper Dockerfiles, switch to production servers, add health checks, externalize all secrets.

Phase 2 — Staging deploy: Use Docker Compose on a single VM first (DigitalOcean Droplet $24/mo or Hetzner). Validates everything works end-to-end cheaply.

Phase 3 — Production with Kubernetes: Move to managed Kubernetes + managed data services.

Where to Deploy (Production Opinion)
Replace self-hosted infra components with managed services — don't run Kafka, Redis, or PostgreSQL yourself in Kubernetes pods, they're hard to operate:

Component	Replace with
PostgreSQL	AWS RDS / Supabase / Neon
Redis	AWS ElastiCache / Upstash
Kafka	Confluent Cloud (free tier available) / AWS MSK
MinIO	AWS S3 / Cloudflare R2
For the application services, my recommendation ranked by simplicity vs. control:

Railway — Easiest, supports Docker Compose-like deploys, good for a diploma project going live quickly. Free tier is generous.
Fly.io — Great for microservices, per-region deploys, very DevOps-friendly.
DigitalOcean Kubernetes (DOKS) — Good balance, $12/node, managed control plane, good docs.
GKE Autopilot (Google Cloud) — Best managed Kubernetes, you pay only for what pods actually use. Good for variable load.
AWS EKS — Most powerful but most complex, worth it only if you're already in AWS ecosystem.
My honest recommendation for a diploma project: Railway or Fly.io for services + Neon (PostgreSQL) + Upstash (Redis) + Confluent Cloud (Kafka) + Cloudflare R2 (S3). You'll be fully production-grade, globally deployed, and it'll cost $20-50/month total. Add Kubernetes later when you need horizontal scaling.

Summary
Fix order: Dockerfiles → Gunicorn → Celery worker → secrets → health checks → remove volume mounts → add Nginx → then deploy. The architecture itself is sound, the pipeline design is good — it's the operational/deployment hygiene that needs work before prod."# Cart-abandonment" 
