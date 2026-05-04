---
id: running-locally
title: KICKLAB — Локалд ажиллуулах
sidebar_label: Локалд ажиллуулах
---

# Локалд ажиллуулах

## Шаардлага

- Node.js 18+
- npm
- PostgreSQL 12+

## Алхам алхмаар

```bash
# 1. Clone хийж суулгах
git clone <repo>
cd sneaker-store
npm install

# 2. PostgreSQL database үүсгэх
psql -U postgres -c "CREATE DATABASE sneakerstore;"

# 3. .env.local тохируулах
cp .env.example .env.local
# DATABASE_URL болон бусдыг тохируулна

# 4. Prisma migrate болон seed
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed   # ~50+ бүтээгдэхүүн, category, brand, size

# 5. Dev server
npm run dev
```

**Локал URL:** http://localhost:3000

## Ашигтай Script-үүд

| Script | Зорилго |
|--------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run prisma:generate` | Prisma client үүсгэх |
| `npm run prisma:migrate` | DB migration |
| `npm run prisma:seed` | Sample data ачаалах |
| `npm run lint` | TypeScript/ESLint шалгах |
