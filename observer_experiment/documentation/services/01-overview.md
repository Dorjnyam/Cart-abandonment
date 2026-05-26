---
sidebar_position: 1
title: Ерөнхий тойм
---

# Ерөнхий тойм — Системийн архитектур

## 1.1 Системийн тухай

Энэхүү баримт бичиг нь e-commerce сессийн аналитик систем (**Cart Analytics**)-ийн бүх үйлчилгээнүүдийг хамарсан техникийн нэгдмэл заавар юм. Тус систем нь **2 web app** болон **5 backend service**-ээс бүрдэнэ.

---

## 1.2 Үйлчилгээнүүдийн жагсаалт

| # | Нэр | Төрөл | Технологи | Port |
|---|-----|-------|-----------|------|
| 1 | [Observer Service](./observer-service) | Backend API + Event Producer | Python/FastAPI | 8001 |
| 2 | [Session Service](./session-service) | Backend Hybrid (API + Kafka consumer) | Python/FastAPI + Celery | 8002 |
| 3 | [Feature Service](./feature-service) | Backend Kafka worker | Python/FastAPI | 8003 |
| 4 | [ML Prediction Service](./ml-prediction-service) | Backend Hybrid (Kafka + API) | Python/FastAPI + XGBoost | 8004 |
| 5 | [Main Service](./main-service) | Backend REST API + Worker | Python/Django + Celery | 8000 |
| 6 | [KICKLAB (Sneaker Store)](./kicklab) | Web App (Ecommerce) | Next.js 16 + Prisma | 3000 |
| 7 | [CartAnalytics Frontend](./cartanalytics) | Web App (Dashboard) | Next.js 16 + TypeScript | 3001 |

---

## 1.3 Дата урсгалын диаграм

```
Browser / KICKLAB Web App
         ↓ track.js (HTTP POST /track)
Observer Service (8001) — PostgreSQL raw_events
         ↓ Kafka: raw_events topic
Session Service (8002) — Redis session state → PostgreSQL sessions
         ↓ Kafka: session_enriched topic
Feature Service (8003) — 76-field behavioral feature vector
         ↓ Kafka: feature_ready topic
ML Prediction Service (8004) — XGBoost inference → PostgreSQL predictions
         ↓ Kafka: prediction_done / prediction_done_v2
Main Service (8000) — Django API + Celery + Gemini fallback → DuckDB + PostgreSQL
         ↓ REST API (JWT)
CartAnalytics Frontend — Dashboard UI
```

---

## 1.4 Ашигласан технологиуд

| Технологи | Хэрэглэгдэж буй газар | Зорилго |
|-----------|----------------------|---------|
| PostgreSQL | Observer, Session, ML, Main Service | Үндсэн мэдээлэл хадгалалт |
| Redis | Session, Main Service | Session state, Celery broker, queue |
| Kafka | Observer→Session→Feature→ML→Main | Async event streaming |
| Docker | Бүх үйлчилгээ | Container deployment |
| XGBoost | ML Prediction Service | Cart abandonment prediction |
| Google Gemini API | Main Service | Монгол зөвлөмжийн text generation |
| DuckDB | Main Service | Local analytics aggregation |
| MinIO/S3 | Main Service | Parquet export |
