---
id: configuration
title: KICKLAB — Тохиргоо
sidebar_label: Тохиргоо
---

# Тохиргоо

## Environment Variables

| Хувьсагч | Шаардлагатай | Тайлбар |
|----------|-------------|---------|
| `DATABASE_URL` | **Тийм** | PostgreSQL холболт |
| `NEXTAUTH_SECRET` | **Тийм (prod)** | JWT session signing random string |
| `NEXTAUTH_URL` | Prod-д тийм | Canonical URL (OAuth callback) |
| `ADMIN_EMAIL` | Үгүй | Env-based admin нэвтрэлтийн имэйл |
| `ADMIN_PASSWORD` | Үгүй | Admin нууц үг |
| `GOOGLE_CLIENT_ID` | Үгүй | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Үгүй | Google OAuth client secret |
| `NEXT_PUBLIC_OBSERVER_URL` | Үгүй | Observer tracking host |
| `NEXT_PUBLIC_OBSERVER_SNIPPET_KEY` | Үгүй | Observer API key |

## .env.local жишээ

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/sneakerstore
NEXTAUTH_SECRET=any-long-random-string-for-dev
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=dev-password-123
NEXT_PUBLIC_OBSERVER_URL=http://localhost:8001
NEXT_PUBLIC_OBSERVER_SNIPPET_KEY=tk_smart_47b9cb1051a8c7dc5e039e35833b7c23
```

:::warning Нууц мэдээлэл
`NEXTAUTH_SECRET`, `ADMIN_PASSWORD`, `GOOGLE_CLIENT_SECRET` нарыг Git-т commit хийхгүй.
:::
