---
id: auth
title: CartAnalytics — Authentication
sidebar_label: Auth
---

# Authentication

## Нэвтрэлтийн арга

Email + Password credential-based — `POST /api/auth/login/` (Django backend)

```json
// Request
{ "username": "user@example.com", "password": "your-password" }

// Response
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "email": "...", "role": "owner" }
}
```

## Token хадгалалт

- `localStorage`: `access_token`, `refresh_token`, `cart_analytic_ui_session`
- **Auto-refresh:** 401 response дээр нэг удаа refresh оролддог
- Refresh амжилтгүй → `/login` руу redirect

## Хэрэглэгчийн дүрүүд

| Дүр | Монгол нэр | Эрх |
|-----|-----------|-----|
| `owner` | Эзэмшигч | Бүрэн эрх, recommendation хэрэгжүүлэх |
| `developer` | Хөгжүүлэгч | Recommendation хэрэгжүүлэх **хориотой** |
| `member` | Гишүүн | Recommendation хэрэгжүүлэх боломжтой |
| `admin` | Администратор | `admin@cartanalytics.mn` → автоматаар |

## Auth Mode тохиргоо

`NEXT_PUBLIC_API_AUTH_MODE`-ийн дагуу:

| Mode | Header |
|------|--------|
| `jwt` | `Authorization: Bearer <token>` |
| `api-key` | `X-API-Key: <key>` |
| `both` | Хоёуланг нь илгээнэ |
| `none` | Auth header илгээхгүй |
