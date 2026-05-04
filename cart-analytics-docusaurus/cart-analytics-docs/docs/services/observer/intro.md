---
id: intro
title: Observer Service — Тойм
sidebar_label: Тойм
---

# Observer Service

## Тойм

| | |
|---|---|
| **Нэр** | Observer Service |
| **Port** | 8001 |
| **Технологи** | Python 3.11+, FastAPI, asyncpg, aiokafka, redis.asyncio |
| **Төрөл** | REST API + Event Producer |
| **Хийдэг зүйл** | Browser-ийн clickstream event-ийг цуглуулж PostgreSQL-д хадгалах, Kafka болон Redis руу дамжуулах |

## Tier системийн тайлбар

Observer нь 3 түвшний API key ашиглан field-level access control хийдэг:

| Tier | Key Prefix | Талбарын тоо | Зорилго |
|------|-----------|--------------|---------|
| T3 | `tk_basic_` | 23 | Үндсэн page analytics |
| T2 | `tk_smart_` | 43 | E-commerce engagement, UX |
| T1 | `tk_full_` | 54 | Cart, payment, бүрэн checkout |

## Дата урсгал

```mermaid
graph LR
    BR["Browser (track.js)"]
    API["Observer API :8001"]
    PG[("PostgreSQL\nraw_events")]
    KAFKA[["Kafka\nraw_events"]]
    REDIS[("Redis\nca:events:*")]
    SES["Session Service"]

    BR -->|"POST /track + X-API-Key"| API
    API -->|"Tier шүүлт + хадгалалт"| PG
    API -->|"async fan-out"| KAFKA
    API -->|"LPUSH"| REDIS
    API -->|"HTTP POST"| SES
```
