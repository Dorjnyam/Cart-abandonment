---
id: troubleshooting
title: KICKLAB — Алдааны шийдэл
sidebar_label: Troubleshooting
---

# Алдааны шийдэл

| Алдаа | Шийдэл |
|-------|--------|
| `DATABASE_URL` тохиргоогүй | `.env.local`-д нэмж, dev server дахин эхлүүлэх |
| "Out of stock" checkout-д | Admin `/admin/products/[id]/edit`-д stock нэмэх |
| Google OAuth алдаа | `GOOGLE_CLIENT_ID/SECRET` болон redirect URI шалгах |
| Observer track.js алдаа | `NEXT_PUBLIC_OBSERVER_URL` шалгах; `NEXTJS_OBSERVER.md` үзэх |
| 429 Too Many Requests | `/api/orders`-д 20 req/мин rate limit — 60с хүлээх |
| Prisma migration алдаа | `.prisma/client` устгаж `prisma:generate + migrate` дахин |
| Build амжилтгүй | `npm run lint` ажиллуулах |

## Debug

```bash
# TypeScript/ESLint шалгах
npm run lint

# Prisma client дахин үүсгэх
npm run prisma:generate

# Verbose build
npm run build -- --verbose
```
