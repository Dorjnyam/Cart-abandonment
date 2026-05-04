---
id: adr
title: Main — Архитектурын шийдвэрүүд
sidebar_label: ADR
---

# Архитектурын шийдвэрүүд (ADRs)

## Django + DRF сонгосон шалтгаан

Хурдан хөгжүүлэлтэд тохиромжтой, diploma/thesis контекст, mature ecosystem.

## Dual Processing Path

- **Redis push:** Observer шууд `ca:diagnosis:queue` руу push хийдэг
- **DB polling:** Observer DB-ийг 30 секунд тутам шалгадаг

Хоёр зам байснаар Observer Redis руу push хийж чадахгүй бол polling 30 секундын дотор нөхнө.

## DuckDB PostgreSQL-ийн хажуугаар

DuckDB local analytics aggregation-д ашиглагдана — OLAP query-г PostgreSQL-аас тусгаарладаг.

## Gemini Fallback

`GEMINI_API_KEY` байхгүй бол static Монгол recommendation текст буцаадаг — system хэзээ ч алдаагүй ажиллана.

## API Key as SHA-256 Hash

Raw key нэг удаа л харагдана (generation-д) — зөвхөн SHA-256 hash хадгалагдана.

## SimpleJWT сонгосон шалтгаан

Access (60мин) + Refresh (7 хоног) token хос, rotation болон blacklist дэмждэг.
