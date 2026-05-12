# Сагс орхилтын шалтгаан шинжилгээний систем

Энэ repository нь “Consumer behavior in e-commerce: analyzing the reasons for cart abandonment” дипломын ажлын thesis MVP хэрэгжүүлэлт юм. Систем нь demo ecommerce үйлдлийн өгөгдлийг Observer-оор цуглуулж, Session, Feature, ML, Main service-ээр боловсруулан Analytics Dashboard дээр prediction, S1-S7 diagnosis, recommendation хэлбэрээр харуулна.

## Архитектурын урсгал

```text
Demo ecommerce
→ Observer
→ PostgreSQL raw_events
→ Kafka raw_events
→ Session
→ Kafka session_enriched
→ Feature
→ Kafka feature_ready
→ ML (XGBoost)
→ Kafka prediction_done
→ Main
→ Dashboard API
→ Analytics dashboard UI
```

## Services and ports

| Service | Port |
|---|---:|
| Demo ecommerce | 3000 |
| Analytics dashboard | 3001 |
| Main API | 8000 |
| Observer | 8001 |
| Session | 8002 |
| Feature | 8003 |
| ML | 8004 |

## Quick start

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Stop and clean local volumes:

```bash
docker compose down -v
```

Default demo login:

- Dashboard: `http://localhost:3001`
- Demo shop: `http://localhost:3000`
- User: `demo@example.com`
- Password: `change-me-demo-password`
- Demo observer key: `tk_full_demo_mvp`

## Health checks

- Main: `http://localhost:8000/api/health/`
- Observer: `http://localhost:8001/health`
- Session: `http://localhost:8002/health`
- Feature: `http://localhost:8003/health`
- ML: `http://localhost:8004/health`

## Баталгаажсан E2E use cases

```bash
python scripts/audit/e2e_three_use_cases.py
```

| Use case | Expected result |
|---|---|
| UC1 technical/mobile abandonment | `ABANDONED`, `S2 Technical friction` |
| UC2 converted purchase | `CONVERTED`, diagnosis/recommendation үүсэхгүй |
| UC3 price-sensitive abandonment | `ABANDONED`, `S5 Price sensitivity` |

## ML claim safety

Active inference model нь XGBoost-only. F1 = 0.8279 нь 1200 synthetic/simulated session dataset дээрх MVP test split-ийн үр дүн бөгөөд бодит хэрэглэгчийн production performance-ийн баталгаа биш.

LSTM нь active inference биш, future work.

## Documentation

Docusaurus баримт бичиг:

```bash
cd cart-analytics-docusaurus/cart-analytics-docs
npm run build
```

Contract docs: `docs/contracts/`

Baseline/evidence:

- `docs/cleanup_baseline/`
- `docs/defense_evidence/`

## Troubleshooting

- Docker engine асуудал: Docker Desktop/Engine ажиллаж байгаа эсэхийг шалга.
- Kafka topic асуудал: `docker compose logs kafka kafka-init`.
- Main consumer readiness: Main health дээр `prediction_done_consumer=ok`.
- Dashboard empty state: Main API real data, auth token, `NEXT_PUBLIC_MOCK_FALLBACK` тохиргоог шалга.
- Gemini unavailable: deterministic fallback recommendation expected behavior.
