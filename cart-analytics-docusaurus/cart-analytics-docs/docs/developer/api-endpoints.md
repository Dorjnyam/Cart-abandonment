---
title: API endpoint-ууд
---

# API documentation

| Service | Endpoint | Purpose |
|---|---|---|
| Main | `GET /api/health/` | Health check |
| Main | `POST /api/auth/login/` | Dashboard auth |
| Main | `GET /api/dashboard/overview/` | Dashboard overview |
| Main | `GET /api/dashboard/sessions/` | Session list |
| Main | `GET /api/dashboard/sessions/{session_id}/` | Session detail |
| Main | `GET /api/dashboard/recommendations/` | Recommendation list |
| Main | `PATCH /api/dashboard/recommendations/{id}/status/` | Recommendation status |
| Observer | `POST /track` | Raw event ingest |
| Observer | `GET /health` | Observer health |
| Session | `GET /health` | Session health |
| Feature | `GET /health` | Feature health |
| ML | `GET /health` | ML health/model loaded |
