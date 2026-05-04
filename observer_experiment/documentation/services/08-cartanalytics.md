---
sidebar_position: 8
title: CartAnalytics Frontend
---

# CartAnalytics Frontend Web App

## 8.1 Тойм

| | |
|---|---|
| **Нэр** | CartAnalytics Frontend (`cart_analytic`) |
| **Port** | 3000 (dev) |
| **Технологи** | Next.js 16.2.1, React 19, TypeScript 5, Tailwind CSS v4, Recharts v3, Lucide React |
| **Эзэмшигч** | Dorjnyam Erdenetsogt |
| **Зорилтот хэрэглэгч** | E-commerce дэлгүүрийн эзэд, хөгжүүлэгчид, багийн гишүүд |

**Хийдэг зүйл:** E-commerce cart abandonment аналитикийн Next.js dashboard. KPI summary, session-level diagnosis, SHAP-based ML explainability, abandonment prediction-ийг Django backend-аас авч харуулдаг.

---

## 8.2 Архитектур

- Django REST API backend-тэй холбогдоно — `src/lib/api-client.ts`-ийн центрлэгдсэн API client
- 3rd party API байхгүй — бүх дата Django backend-аас ирдэг
- **Deployment:** Node.js сервер дотор `next start`, Vercel/Docker боломжтой
- **API timeout:** 10,000ms | Network алдаа тохиолдвол toast мессеж харуулна

---

## 8.3 Тохиргоо

| Хувьсагч | Тайлбар |
|---------|---------|
| `NEXT_PUBLIC_API_URL` | Django API base URL (жишээ: `https://api.example.com/api`) |
| `NEXT_PUBLIC_API_AUTH_MODE` | Auth mode: `none` \| `jwt` \| `api-key` \| `both` |
| `NEXT_PUBLIC_API_KEY` | API key (`api-key` mode-д) |
| `NEXT_PUBLIC_API_JWT` | Static JWT (`jwt` mode-д) |
| `NEXT_PUBLIC_MOCK_FALLBACK` | `'true'` — API байхгүй үед mock data ашиглах |

:::warning
`NEXT_PUBLIC_*` env var-ууд browser bundle-д харагдана — нууц мэдээлэл орхихгүй.
:::

---

## 8.4 Локалд ажиллуулах

```bash
git clone <repo> && cd cart_analytic_web
cp .env.local.example .env.local   # API URL болон auth тохируулна
npm install && npm run dev
```

**Локал URL:** http://localhost:3000

:::tip
Mock data: API хүрч чадахгүй үед автоматаар mock data ашиглана — backend байхгүй үед dev-д тохиромжтой.
:::

---

## 8.5 Authentication

- Email + Password credential-based login — `POST /api/auth/login/`
- JWT access + refresh token хос буцаадаг
- Token `localStorage`-д хадгалагдана (`access_token`, `refresh_token`)
- 401 дээр auto-refresh нэг удаа оролддог; амжилтгүй бол `/login` руу дахин чиглүүлнэ

### Хэрэглэгчийн дүрүүд (Roles)

| Дүр | Монгол нэр | Тайлбар |
|-----|-----------|---------|
| `owner` | Эзэмшигч | Бүрэн эрх, recommendation хэрэгжүүлэх боломжтой |
| `developer` | Хөгжүүлэгч | Recommendation хэрэгжүүлэх хориотой |
| `member` | Гишүүн | Recommendation хэрэгжүүлэх боломжтой |
| `admin` | Администратор | `admin@cartanalytics.mn` имэйлд автоматаар олгогдоно |

---

## 8.6 Inter-Service Communication

- Нэг Django REST API backend-тай харилцдаг
- **Protocol:** REST (JSON over HTTP/HTTPS)
- **Auth:** `Authorization: Bearer <token>` header эсвэл `X-API-Key` header
- **Үндсэн endpoint-үүд:** `/api/auth/*`, `/api/analytics/*`, `/api/sessions/*`, `/api/predictions/*`

---

## 8.7 Алдааны шийдэл

| Алдаа | Шийдэл |
|-------|--------|
| API timeout (10s) | Toast мессеж гарна, `NEXT_PUBLIC_API_URL` шалгана |
| 401 Unauthorized | Auto-refresh оролддог, амжилтгүй бол дахин нэвтрэлтэд чиглүүлнэ |
| Mock data харагдана | `NEXT_PUBLIC_API_URL` тохируулсан эсэхийг шалгана |
| Build алдаа | `npm run lint` ажиллуулна, TypeScript алдааг засна |

---

## 8.8 Changelog

**Одоогийн хувилбар:** 0.1.0 (`package.json`)

- **2026-04-22:** Томоохон шинэчлэлт
- **2026-04-22:** `.gitignore` хатуужсан — `AGENTS.md`, `CLAUDE.md`, design spec, `.env.*` файлуудыг remote-оос хасав
- **2026-04-21:** Анхны commit
