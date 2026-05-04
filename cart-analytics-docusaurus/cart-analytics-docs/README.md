# Cart Analytics — Техникийн баримт бичиг (Docusaurus)

## Ажиллуулах заавар

```bash
npm install
npm start        # Dev server → http://localhost:3000
npm run build    # Static build → /build хавтас
npm run serve    # Build-ийг локалд ажиллуулах
```

## Бүтэц

```
docs/
├── overview/          # Ерөнхий тойм, архитектур, эхлэлийн заавар
├── web/
│   ├── kicklab/       # KICKLAB sneaker store (Next.js)
│   └── cart-analytics/# CartAnalytics dashboard (Next.js)
└── services/
    ├── observer/      # Observer Service (FastAPI :8001)
    ├── session/       # Session Service (FastAPI+Celery :8002)
    ├── feature/       # Feature Service (Kafka worker :8003)
    ├── ml/            # ML Prediction Service (FastAPI :8004)
    └── main/          # Main Service (Django :8000)
```

## Sidebar-ууд

- **Тойм** — системийн архитектур, Kafka topic-ууд, port-уудын жагсаалт
- **Web Apps** — KICKLAB болон CartAnalytics Frontend
- **Services** — 5 backend service тус бүрийн бүрэн баримт бичиг

## Нэмэлт мэдээлэл

Node.js 22 + Docusaurus 3.10 хооронд webpack ProgressPlugin-ийн compatibility issue байдаг.
`node_modules/schema-utils/dist/validate.js`-д patch хийсэн тул `npm install` дахин хийвэл дахин patch хэрэгтэй:

```bash
node -e "
const fs = require('fs');
const p = 'node_modules/schema-utils/dist/validate.js';
let src = fs.readFileSync(p, 'utf8');
src = src.replace(
  'function validate(schema, options, configuration) {',
  'function validate(schema, options, configuration) { if (configuration && configuration.name === \"Progress Plugin\") return;'
);
fs.writeFileSync(p, src);
"
```
