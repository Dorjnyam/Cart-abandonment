---
id: adr
title: Observer — Архитектурын шийдвэрүүд
sidebar_label: ADR
---

# Архитектурын шийдвэрүүд (ADRs)

## Python + FastAPI сонгосон шалтгаан

Async-first framework нь I/O-heavy event processing-д (Kafka + Redis + PostgreSQL) тохиромжтой. Built-in Pydantic validation нь tier filtering болон field coercion-ийг хялбарчилдаг.

## PostgreSQL MongoDB-ийн оронд

- ACID баталгаа (event алдагдахгүй)
- `event_id` unique constraint (давхардал хаах)
- GIN index on JSONB (payload query хурдан)
- Mature backup болон monitoring tool

## 3-Tier загвар (T1/T2/T3)

- **Өгөгдлийн нууцлал:** Cart, payment мэдээлэл зөвхөн T1-д
- **Audit trail:** Tier event тус бүрт immutable хэлбэрээр хадгалагдана
- **Уян хатан байдал:** Шинэ tier нэмэхэд schema өөрчлөгдөхгүй

## Fire-and-forget fan-out

Kafka/Redis алдаа гарсан ч PostgreSQL-д event хадгалагдана. Ingest latency Kafka/Redis delay-д суурилдаггүй.

## Ирээдүйд сайжруулах зүйлс

- Prometheus metrics нэмэх
- Per API key rate limiting
- Cursor-based pagination query endpoint-д
- Event versioning (schema migration strategy)
