# Cart Analytics Dashboard

Энэ frontend нь сагс орхилтын dashboard, session detail, S1-S7 diagnosis, recommendation болон model insight харах Next.js App Router application юм.

## Асаах

1. Environment файл бэлдэнэ.

```bash
cp .env.local.example .env.local
```

2. `.env.local` дотор API тохиргоо өгнө.

| Variable | Тайлбар |
|---|---|
| `NEXT_PUBLIC_API_URL` | Main service API base URL, жишээ нь `http://localhost:8000/api` |
| `NEXT_PUBLIC_API_AUTH_MODE` | `none`, `jwt`, `api-key`, эсвэл `both` |
| `NEXT_PUBLIC_API_KEY` | API key ашиглах үед бөглөнө |
| `NEXT_PUBLIC_API_JWT` | JWT ашиглах үед бөглөнө |
| `NEXT_PUBLIC_MOCK_FALLBACK` | API байхгүй үед demo fallback зөвшөөрөх эсэх |

3. App ажиллуулна.

```bash
npm install
npm run dev
```

Default URL: `http://localhost:3001`

## Гол route-ууд

| Route | Үүрэг |
|---|---|
| `/dashboard` | KPI, abandonment trend, drop-off, traffic summary |
| `/sessions` | Session жагсаалт, risk score, filter |
| `/sessions/[id]` | Event timeline, feature vector, SHAP тайлбар |
| `/diagnosis` | S1-S7 шалтгааны задаргаа |
| `/recommendations` | Main service-ээс ирсэн recovery task-ууд |
| `/analytics` | Feature importance, prediction тархалт, trend |
| `/ml-insights` | Model metric, confusion matrix, SHAP summary |
| `/pipeline` | Service health болон event pipeline status |
| `/settings` | Store, team, API key тохиргоо |

## Code бүтэц

- `src/lib/api-client.ts` - request, auth header, error handling
- `src/lib/api-config.ts` - endpoint path-ууд
- `src/lib/services/*` - API response mapping
- `src/types/api.ts` - dashboard-д ашиглах DTO төрлүүд
- `src/components/ui/*` - давтагддаг UI component-ууд
- `src/app/*` - page-level route болон data loading

## API contract өөрчлөгдвөл

1. `src/types/api.ts` дотор DTO төрлүүдийг шинэчилнэ.
2. Endpoint path болон mapping-ийг `src/lib/services/*` дотор засна.
3. Page болон chart component-уудыг зөвхөн өгөгдлийн shape үнэхээр өөр болсон үед өөрчилнө.

Энэ бүтэц нь UI-г backend contract-оос хэт хамааралтай болгохгүй байхаар салгасан.
