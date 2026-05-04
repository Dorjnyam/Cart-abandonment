---
id: intro
title: Системийн тойм
sidebar_label: Тойм
slug: /intro
---

# Cart Analytics — Системийн тойм

Энэхүү баримт бичиг нь e-commerce сессийн аналитик системийн **бүх үйлчилгээ**-ний техникийн нэгдмэл заавар юм.

## Системд багтах үйлчилгээнүүд

| # | Нэр | Төрөл | Технологи | Port |
|---|-----|-------|-----------|------|
| 1 | Observer Service | Backend API + Event Producer | Python/FastAPI | 8001 |
| 2 | Session Service | Backend Hybrid | Python/FastAPI + Celery | 8002 |
| 3 | Feature Service | Kafka worker | Python/FastAPI | 8003 |
| 4 | ML Prediction Service | Kafka + API | Python/FastAPI + XGBoost/LSTM | 8004 |
| 5 | Main Service | REST API + Worker | Python/Django + Celery | 8000 |
| 6 | KICKLAB | Web App (E-commerce) | Next.js 16 + Prisma | 3000 |
| 7 | CartAnalytics Frontend | Web App (Dashboard) | Next.js 16 + TypeScript | 3000 |

## Ашигласан технологиуд

| Технологи | Зорилго |
|-----------|---------|
| PostgreSQL | Үндсэн мэдээлэл хадгалалт |
| Redis | Session state, Celery broker, queue |
| Kafka | Async event streaming |
| XGBoost + LSTM | Cart abandonment prediction |
| Google Gemini API | AI recommendation (Монгол хэлэнд) |
| DuckDB | Local analytics aggregation |
