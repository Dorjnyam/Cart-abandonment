---
id: api
title: Main — API Лавлагаа
sidebar_label: API
---

# API Лавлагаа

## Auth Endpoint-үүд (Auth шаардлагагүй)

| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/api/auth/register/` | Хэрэглэгч бүртгэх + tenant үүсгэх |
| POST | `/api/auth/login/` | Нэвтрэх → access + refresh token |
| POST | `/api/auth/logout/` | Refresh token blacklist |
| POST | `/api/auth/token/refresh/` | Token шинэчлэх |
| GET/PATCH | `/api/auth/profile/` | Профайл |

## Analytics Endpoint-үүд (JWT шаардлагатай)

| Арга | Зам | Тайлбар |
|------|-----|---------|
| GET | `/api/analytics/overview/` | Dashboard тойм метрик |
| GET | `/api/analytics/scores/` | S1-S7 оноогийн нийлбэр |
| GET | `/api/analytics/recommendation/` | Сүүлийн AI recommendation |
| PATCH | `/api/analytics/recommendation/{id}/implement/` | Хэрэгжсэн тэмдэглэх |
| GET | `/api/sessions/` | Session жагсаалт |
| GET | `/api/sessions/{id}/` | Session + SHAP |
| GET | `/api/predictions/` | Prediction жагсаалт |
| GET | `/api/diagnosis/` | Diagnosis жагсаалт |
| POST | `/api/tenant/apikey/generate/` | API key үүсгэх |
| GET | `/api/settings/api-keys/` | API key жагсаалт |
| POST | `/api/export/` | MinIO export |
| GET | `/api/health/` | Health check |

## Observer Ingest (API Key шаардлагатай)

| Арга | Зам | Тайлбар |
|------|-----|---------|
| POST | `/track` | Event хүлээн авах — `X-API-Key` header |

## Token-ийн мэдээлэл

- Access token: **60 минут**
- Refresh token: **7 хоног**
- Refresh token rotate + blacklist on logout
