---
id: running-locally
title: CartAnalytics — Локалд ажиллуулах
sidebar_label: Локалд ажиллуулах
---

# Локалд ажиллуулах

## Шаардлага

- Node.js 20+ (recommended)
- npm

## Алхам алхмаар

```bash
# 1. Clone хийж суулгах
git clone <repo>
cd cart_analytic_web

# 2. .env.local тохируулах
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL болон auth mode тохируулна

# 3. Суулгах
npm install

# 4. Dev server
npm run dev
```

**Локал URL:** http://localhost:3000

## Mock Data

```bash
# .env.local-д:
NEXT_PUBLIC_MOCK_FALLBACK=true
```

API хүрч чадахгүй үед автоматаар mock data ашиглана — backend байхгүй үед dev-д тохиромжтой.

:::tip
`npm run dev` нь `--webpack` flag ашигладаг (Turbopack биш). `next.config.ts`-д Turbopack root тохируулагдсан байдаг — dev болон build хооронд зөрүү гарч болно.
:::
