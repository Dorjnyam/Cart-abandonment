---
id: troubleshooting
title: CartAnalytics — Алдааны шийдэл
sidebar_label: Troubleshooting
---

# Алдааны шийдэл

| Алдаа | Шийдэл |
|-------|--------|
| API timeout (10s) | Toast мессеж гарна — `NEXT_PUBLIC_API_URL` шалгах |
| 401 Unauthorized | Auto-refresh амжилтгүй → дахин нэвтрэх |
| Mock data харагдана | `NEXT_PUBLIC_API_URL` тохируулсан эсэхийг шалгах |
| Build алдаа | `npm run lint` ажиллуулах |
| Toast Монгол текст харагдахгүй | `src/lib/toastBridge.ts` шалгах |

## Debug

```bash
# Lint
npm run lint

# Build verbose
npm run build

# API холболт шалгах
curl "$NEXT_PUBLIC_API_URL/health/" -H "Authorization: Bearer $TOKEN"
```

## Network алдаа

```javascript
// ApiError кодууд:
// TIMEOUT    — 10s timeout хэтэрсэн
// NETWORK_ERROR — Сүлжээний алдаа
// HTTP_{code}   — HTTP алдааны код
```
