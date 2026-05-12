# Сагс орхилтын шинжилгээний Docusaurus docs

Энэ site нь дипломын ажлын MVP системийн Монгол баримт бичиг юм.

```bash
npm install
npm run build
npm start
```

## Тайлбар

Node.js 22 + Docusaurus 3.10 орчинд webpack ProgressPlugin validation issue гарч болдог. `postinstall` болон `prebuild` script нь `schema-utils` validation patch-г автоматаар хийдэг.
