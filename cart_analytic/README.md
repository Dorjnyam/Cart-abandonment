# CartAnalytics Frontend

Next.js App Router frontend for cart abandonment analytics dashboards, session-level diagnostics, and SHAP-based explainability views.

## Setup

1. Copy env template:

```bash
cp .env.local.example .env.local
```

2. Set values in `.env.local`:

- `NEXT_PUBLIC_API_URL`: Django API base URL (example: `https://api.example.com/api`)
- `NEXT_PUBLIC_API_AUTH_MODE`: `none` | `jwt` | `api-key` | `both`
- `NEXT_PUBLIC_API_KEY`: optional API key when auth mode includes `api-key`
- `NEXT_PUBLIC_API_JWT`: optional JWT when auth mode includes `jwt`

3. Run app:

```bash
npm install
npm run dev
```

## Implemented routes

- `/dashboard` - KPI summary, abandonment trend, drop-off, traffic blocks
- `/sessions` - paginated session-style list with prediction score
- `/sessions/[id]` - timeline + SHAP waterfall + feature vector view
- `/analytics` - feature importance, abandonment trend, prediction distribution

## API integration notes

- API layer is centralized in:
  - `src/lib/api-client.ts`
  - `src/lib/api-config.ts`
  - `src/lib/services/*`
- Domain contracts are in:
  - `src/types/api.ts`
- Current services include mock fallback data when API is unavailable, so UI remains demo-friendly.

## Swapping to OpenAPI contract later

When OpenAPI URL/spec is provided:

1. Update DTOs in `src/types/api.ts`.
2. Update endpoint paths and response mapping only in `src/lib/services/*`.
3. Keep page and chart components unchanged unless the API model fundamentally changes.
