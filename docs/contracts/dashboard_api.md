# Dashboard API contract

## Purpose

Main service нь Analytics dashboard-д real data-first API contract өгнө. Normal mode-д frontend fake/mock өгөгдлийг бодит мэт харуулахгүй.

## Producer / Consumer

| Producer | Consumer |
|---|---|
| Main service Dashboard API | `cart_analytic` Next.js frontend |

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/dashboard/overview/` | Summary, model info, S1-S7 reasons, recent sessions. |
| `GET /api/dashboard/sessions/` | Paginated session history. |
| `GET /api/dashboard/sessions/{session_id}/` | Session detail, prediction, diagnosis, recommendation. |
| `GET /api/dashboard/recommendations/` | Recommendation list. |
| `PATCH /api/dashboard/recommendations/{id}/status/` | Recommendation status update. |
| `GET /api/dashboard/integration/` | Observer snippet, Kafka topics, demo URLs. |

## Required behavior

- Converted UC2 дээр `diagnosis=null`, `recommendation=null`.
- Abandoned UC1/UC3 дээр `diagnosis.dominant_reason` нь S2/S5 байна.
- `model.active_model = "xgboost"`.
- `dataset_type` synthetic limitation-ыг нуухгүй.

## Failure behavior

Authгүй request 401/403 буцаана. Empty database бол dashboard empty state харуулна, fake data рүү silent fallback хийхгүй.

## Related tests

- `main_service/apps/analytics/tests.py::test_dashboard_overview_returns_business_contract`
- `main_service/apps/analytics/tests.py::test_dashboard_recommendation_status_patch`
