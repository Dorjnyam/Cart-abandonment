---
sidebar_position: 7
title: KICKLAB (Sneaker Store)
---

# KICKLAB — Sneaker Store Web App

## 7.1 Тойм

| | |
|---|---|
| **Нэр** | KICKLAB |
| **Port** | 3000 (dev) |
| **Технологи** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma 7, PostgreSQL, NextAuth v4, Zustand |
| **Зорилтот хэрэглэгч** | Нийтийн: sneaker худалдан авагчид · Admin: дотоод ажилчид |

**Хийдэг зүйл:** Premium dark-mode sneaker e-commerce platform — нийтийн catalog, хайлт, бүтээгдэхүүний дэлгэрэнгүй, shopping cart, checkout, хэрэглэгчийн данс, болон admin **'Vault'** интерфейстэй.

---

## 7.2 Архитектур

- **Монолит Next.js app** — API route бүгд дотор нь байдаг
- PostgreSQL-д **Prisma ORM**-ийн тусламжтай холбогдоно
- **Google OAuth** _(заавал биш)_ — `GOOGLE_CLIENT_ID/SECRET` env var тохируулбал идэвхждэг
- Observer tracking service-тэй холбогдоно — `NEXT_PUBLIC_OBSERVER_URL`-аар
- Зургийн CDN: `picsum.photos`, `images.pexels.com` (`next.config.ts`-д зааснаар)

---

## 7.3 Тохиргоо

| Хувьсагч | Шаардлагатай | Тайлбар |
|---------|-------------|---------|
| `DATABASE_URL` | Тийм | PostgreSQL холболт |
| `NEXTAUTH_SECRET` | Тийм (prod) | JWT session signing-ийн урт random string |
| `NEXTAUTH_URL` | Prod-д тийм | Canonical site URL (OAuth callback-д хэрэгтэй) |
| `ADMIN_EMAIL` | Үгүй | Env-based admin нэвтрэлтийн имэйл |
| `ADMIN_PASSWORD` | Үгүй | Admin нууц үг |
| `GOOGLE_CLIENT_ID` | Үгүй | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Үгүй | Google OAuth client secret |
| `NEXT_PUBLIC_OBSERVER_URL` | Үгүй | Observer tracking host (default: `localhost:8001`) |
| `NEXT_PUBLIC_OBSERVER_SNIPPET_KEY` | Үгүй | Observer API key (`tk_basic_`/`smart_`/`full_`) |

---

## 7.4 Локалд ажиллуулах

```bash
git clone <repo> && cd sneaker-store && npm install

# PostgreSQL database үүсгэнэ
psql -U postgres -c 'CREATE DATABASE sneakerstore;'

# .env.local файл тохируулна
npm run prisma:generate && npm run prisma:migrate
npm run prisma:seed    # Sample catalog data (~50+ бүтээгдэхүүн)
npm run dev
```

**Локал URL:** http://localhost:3000

---

## 7.5 Authentication & Roles

| Role | Эрх |
|------|-----|
| Admin | `/admin/*` бүрэн эрх — бүтээгдэхүүн, захиалга, coupon удирдах |
| Customer (default) | Catalog үзэх, cart нэмэх, checkout, өөрийн захиалга харах |

Admin хандах 2 арга:
1. `ADMIN_EMAIL` + `ADMIN_PASSWORD` env var тохируулах
2. DB-д `role='admin'` тохируулах

---

## 7.6 Deployment

- **Vercel**-д шууд deploy боломжтой (стандарт Next.js бүтэц)
- Эсвэл `npm run build` → `npm start` (Node.js сервер дээр)
- CI/CD: Репозиторид олдсонгүй — мануал эсвэл Vercel auto-deploy

---

## 7.7 Алдааны шийдэл

| Алдаа | Шийдэл |
|-------|--------|
| `DATABASE_URL` тохиргоогүй | `.env.local`-д `DATABASE_URL` нэмж процесс дахин эхлүүлнэ |
| Барааны нөөц дуссан | Admin `/admin/products/[id]/edit`-д stock нэмнэ |
| Google OAuth алдаа | `GOOGLE_CLIENT_ID/SECRET` болон redirect URI тохируулсан эсэхийг шалгана |
| Observer `track.js` алдаа | `NEXT_PUBLIC_OBSERVER_URL` хүрэх эсэхийг шалгана; `NEXTJS_OBSERVER.md` үзнэ |
| 429 Too Many Requests | Rate limit: `/api/orders`-д 20 req/мин — 60с хүлээнэ |
| Prisma migration алдаа | `.prisma/client` устгаж `prisma:generate` + `prisma:migrate` дахин ажиллуулна |

---

## 7.8 Changelog

**Одоогийн хувилбар:** 0.1.0 (`package.json`)

- Next.js 16 App Router руу шилжсэн
- React 19 support
- Prisma 7 + `@prisma/adapter-pg` pool driver
- Per-size stock model (бүтээгдэхүүний түвшин биш — size-ийн түвшний нөөц)
