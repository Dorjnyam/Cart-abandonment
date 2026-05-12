---
id: intro
title: Системийн тойм
sidebar_label: Тойм
slug: /intro
---

# Cart Analytics системийн тойм

Энэ legacy overview нь бүх service-ийн техникийн богино лавлагаа юм. Thesis MVP-ийн баталгаатай claim: XGBoost active model, S1-S7 diagnosis, UC1/UC2/UC3 E2E flow.

## Системд багтах үйлчилгээ

| # | Нэр | Төрөл | Технологи | Port |
|---|---|---|---|---:|
| 1 | Observer Service | Backend API + Event Producer | Python/FastAPI | 8001 |
| 2 | Session Service | Backend Hybrid | Python/FastAPI + Celery | 8002 |
| 3 | Feature Service | Kafka worker | Python/FastAPI | 8003 |
| 4 | ML Prediction Service | Kafka + API | Python/FastAPI + XGBoost active | 8004 |
| 5 | Main Service | REST API + Worker | Python/Django + Celery | 8000 |
| 6 | KICKLAB | Web App (E-commerce) | Next.js + Prisma | 3000 |
| 7 | CartAnalytics Frontend | Web App (Dashboard) | Next.js + TypeScript | 3001 |

## Ашигласан технологиуд

| Технологи | Зорилго |
|---|---|
| PostgreSQL | Үндсэн мэдээлэл хадгалалт |
| Redis | Session state, Celery broker, queue |
| Kafka | Async event streaming |
| XGBoost | Active cart abandonment prediction |
| LSTM | Future work, active inference биш |
| Google Gemini API | AI recommendation, unavailable үед fallback |
| DuckDB | Local analytics aggregation |
