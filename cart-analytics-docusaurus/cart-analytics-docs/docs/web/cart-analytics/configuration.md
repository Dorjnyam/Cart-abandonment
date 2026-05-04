---
id: configuration
title: CartAnalytics — Тохиргоо
sidebar_label: Тохиргоо
---

# Тохиргоо

## Environment Variables

| Хувьсагч | Тайлбар |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | Django API base URL (жишээ: `https://api.example.com/api`) |
| `NEXT_PUBLIC_API_AUTH_MODE` | Auth mode: `none` / `jwt` / `api-key` / `both` |
| `NEXT_PUBLIC_API_KEY` | API key (`api-key` mode-д) |
| `NEXT_PUBLIC_API_JWT` | Static JWT (`jwt` mode-д) |
| `NEXT_PUBLIC_MOCK_FALLBACK` | `"true"` — API байхгүй үед mock data |

## .env.local жишээ

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_AUTH_MODE=jwt
NEXT_PUBLIC_MOCK_FALLBACK=true
```

:::warning Browser-д харагдана
`NEXT_PUBLIC_*` prefix бүхий env var-ууд browser bundle-д харагдана. Нууц мэдээлэл оруулахгүй.
:::

## Config файлууд

- `.env.local` — environment variables (`cp .env.local.example .env.local`)
- `next.config.ts` — Next.js тохиргоо
- `src/lib/api-client.ts` — API client (timeout: 10,000ms)
