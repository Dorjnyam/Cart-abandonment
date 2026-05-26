# Сагс орхилтын шалтгаан шинжилгээний систем

Энэ repository нь “Consumer behavior in e-commerce: analyzing the reasons for cart abandonment” дипломын ажлын практик хэсэг юм. Системийн зорилго нь demo e-commerce дэлгүүрийн хэрэглэгчийн үйлдлийг цуглуулж, session болгон нэгтгэж, сагс орхих магадлал болон S1-S7 шалтгааны оношлогоог dashboard дээр харуулах.

## Системийн урсгал

```text
Demo ecommerce
-> Observer
-> PostgreSQL raw_events
-> Kafka raw_events
-> Session
-> Kafka session_enriched
-> Feature
-> Kafka feature_ready
-> ML (XGBoost)
-> Kafka prediction_done
-> Main API
-> Analytics dashboard
```

## Гол service-үүд

| Service | Port | Үүрэг |
|---|---:|---|
| Demo ecommerce | 3000 | Туршилтын sneaker store |
| Analytics dashboard | 3001 | Session, prediction, diagnosis, recommendation харах UI |
| Main API | 8000 | Dashboard API, tenant, diagnosis, recommendation |
| Observer | 8001 | Browser event цуглуулах |
| Session | 8002 | Raw event-үүдийг session болгон нэгтгэх |
| Feature | 8003 | ML-д орох feature vector бэлдэх |
| ML | 8004 | XGBoost prediction гаргах |

## Ажиллуулах

```bash
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

Зогсоох, local volume цэвэрлэх:

```bash
docker compose down -v
```

Demo оролт:

- Dashboard: `http://localhost:3001`
- Demo shop: `http://localhost:3000`
- Email: `demo@example.com`
- Password: `change-me-demo-password`
- Observer key: `tk_full_demo_mvp`

## Health check

- Main: `http://localhost:8000/api/health/`
- Observer: `http://localhost:8001/health`
- Session: `http://localhost:8002/health`
- Feature: `http://localhost:8003/health`
- ML: `http://localhost:8004/health`

## E2E шалгалт

Гурван үндсэн хэрэглээний кейсийг доорх script-ээр шалгана.

```bash
python scripts/audit/e2e_three_use_cases.py
```

| Use case | Хүлээгдэж буй үр дүн |
|---|---|
| UC1 technical/mobile abandonment | `ABANDONED`, `S2 Technical friction` |
| UC2 converted purchase | `CONVERTED`, diagnosis/recommendation үүсэхгүй |
| UC3 price-sensitive abandonment | `ABANDONED`, `S5 Price sensitivity` |

## ML үр дүнг тайлбарлах нь

Одоогийн inference path нь XGBoost загвар ашиглаж байгаа. F1 = 0.8279 нь 1200 synthetic/simulated session бүхий MVP test split дээр гарсан үр дүн. Үүнийг бодит production хэрэглэгчдийн баталгаатай performance гэж тайлбарлахгүй.

LSTM код нь дараагийн судалгааны чиглэлд үлдсэн бөгөөд одоогийн prediction pipeline-д идэвхтэй ашиглагдахгүй.

## Баримт бичиг

Үндсэн contract болон хамгаалалтын материал:

- `docs/contracts/`
- `docs/defense_evidence/`
- `docs/final_audit/`

Docusaurus documentation build:

```bash
cd cart-analytics-docusaurus/cart-analytics-docs
npm run build
```

## Түгээмэл асуудал

- Docker асахгүй бол Docker Desktop/Engine ажиллаж байгаа эсэхийг шалгана.
- Kafka topic үүсээгүй бол `docker compose logs kafka kafka-init` гэж шалгана.
- Main service prediction consumer бэлэн эсэхийг `/api/health/` дээрээс харна.
- Dashboard хоосон байвал Main API, login token, `NEXT_PUBLIC_MOCK_FALLBACK` тохиргоог шалгана.
- Gemini key байхгүй үед систем deterministic fallback recommendation ашиглана.
