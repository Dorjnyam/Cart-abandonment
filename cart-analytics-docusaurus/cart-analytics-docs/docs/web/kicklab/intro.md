---
id: intro
title: KICKLAB — Тойм
sidebar_label: Тойм
---

# KICKLAB — Sneaker Store

| | |
|---|---|
| **Нэр** | KICKLAB |
| **Port** | 3000 (dev) |
| **Технологи** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 7, PostgreSQL, NextAuth v4, Zustand |
| **Зорилтот хэрэглэгч** | Нийтийн: sneaker худалдан авагчид / Admin: дотоод ажилчид |
| **Хийдэг зүйл** | Premium dark-mode sneaker e-commerce — catalog, cart, checkout, хэрэглэгчийн данс, admin Vault |

## Архитектур

```mermaid
graph TD
    USER["👤 Хэрэглэгч / Admin"]
    NEXT["Next.js App
:3000
(App Router)"]
    API["Next.js API Routes
/api/*"]
    PG[("PostgreSQL
(Prisma ORM)")]
    AUTH["NextAuth v4
JWT sessions"]
    CART["Zustand Cart
localStorage"]
    OBS["Observer Service
:8001
(tracking, заавал биш)"]
    GOOGLE["Google OAuth
(заавал биш)"]

    USER --> NEXT
    NEXT --> API
    API --> PG
    API --> AUTH
    AUTH --> GOOGLE
    NEXT --> CART
    NEXT -->|"track.js snippet"| OBS
```

## Үндсэн боломжууд

- 🛍️ Бүтээгдэхүүний catalog, хайлт, дэлгэрэнгүй
- 🛒 Zustand + localStorage cart (нэвтрэлтгүй хэрэглэгчдэд)
- 💳 Checkout + захиалгын систем (per-size stock)
- 👤 Хэрэглэгчийн данс — захиалгын түүх
- 🔐 Email/Password + Google OAuth нэвтрэлт
- 🏢 Admin "Vault" — catalog, захиалга, coupon, analytics
