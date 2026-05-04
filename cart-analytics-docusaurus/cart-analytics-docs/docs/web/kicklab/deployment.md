---
id: deployment
title: KICKLAB — Deployment
sidebar_label: Deployment
---

# Deployment

## Build

```bash
npm run build
# .next/ хавтаст output үүснэ

npm start
# Production server :3000
```

## Vercel (зөвлөмж)

Next.js app Vercel-д шууд deploy хийх боломжтой:

1. Vercel-д project холбох
2. Environment variables тохируулах
3. `npm run build` автоматаар ажиллана

## Дарааллын шаардлага

1. **PostgreSQL** заавал эхлээд байх
2. Observer Service (заавал биш) — tracking-д хэрэгтэй
3. CI/CD: Репозиторид тохиргоогүй — мануал эсвэл Vercel auto-deploy

:::info
`npm run build` хийхийн өмнө бүх env var тохируулсан эсэхийг шалгана.
:::
