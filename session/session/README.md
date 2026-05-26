# Session Service

Session service нь Observer-оос ирсэн `raw_events`-ийг Redis дээр session state болгон хуримтлуулна. 30/60/90 секунд дээр early snapshot гаргаж `session_enriched` topic руу илгээнэ. Session дуусах үед final snapshot-ийг Kafka руу илгээж PostgreSQL-д хадгална.

## Ажиллуулах

1. Environment файл үүсгэнэ.

```powershell
copy .env.example .env
```

2. Dependency суулгана.

```powershell
pip install -r requirements.txt
```

3. API болон Kafka consumer асаана.

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

4. 30/60/90 секундын snapshot-д Celery worker хэрэгтэй.

```powershell
celery -A celery_app worker --loglevel=info
```

Windows дээр `celery_app.py` нь default pool-ийг `solo` болгосон. Ижил Redis/Kafka тохиргоотой worker ажиллаж байж scheduled snapshot topic руу гарна.

## Pipeline

| Алхам | Хаана ажиллах | Тайлбар |
|---|---|---|
| Raw ingest | FastAPI + Kafka consumer | Event давхардлыг шалгаж Redis `session:{id}` hash-д хадгална |
| Window snapshot | Celery `emit_window_snapshot` | 30/60/90 секундийн snapshot гаргана |
| Enriched event | Celery -> Kafka | `session_enriched` topic руу publish хийнэ |
| Final flush | API sweeper эсвэл manual flush | Final session PostgreSQL-д бичигдэнэ |

`flush_session` нь `beforeunload`, `is_order_success`, эсвэл TTL дуусах үед ажиллана. Энэ үед final enriched message гарч Redis key-үүд цэвэрлэгдэнэ.

## Manual flush

```bash
curl -s -X POST http://localhost:8002/ingest/flush-session \
  -H "Content-Type: application/json" \
  -d "{\"session_id\":\"YOUR_SESSION_ID\"}"
```

`SESSION_INGEST_API_KEY` тохируулсан бол `X-API-Key` header нэмнэ.

## Observer integration

Observer event-ийг хоёр замаар дамжуулж болно.

| Зам | Тайлбар |
|---|---|
| Kafka | Observer -> `raw_events` topic -> Session consumer |
| HTTP | Observer -> `POST /ingest/raw-event` |

Ижил event Kafka болон HTTP хоёр замаар зэрэг ирж байвал `SESSION_DEDUPE_EVENT_ID=1` давхардлыг алгасна. Боломжтой бол нэг үндсэн зам сонгож ажиллуулах нь debug хийхэд амар.

Observer талын opaque `session_id`, `visitor_id` string-үүдийг service дотооддоо UUIDv5 болгон тогтвортой map хийдэг. `tenant_id` ирэхгүй бол `SESSION_DEFAULT_TENANT_ID` ашиглана.

## Шалгах командууд

```bash
kafka-console-consumer --bootstrap-server localhost:9092 --topic session_enriched --from-beginning
redis-cli keys "session:*"
redis-cli keys "session_winsched:*"
psql "$PG_DSN" -c "SELECT session_id, event_count, session_duration_sec, is_completed_purchase FROM sessions.sessions ORDER BY ended_at DESC LIMIT 10;"
```

Хүлээгдэж буй үр дүн:

- T+30, T+60, T+90 орчимд `window_seconds` 30/60/90 бүхий snapshot гарна.
- Final message дээр `window_seconds = null` байна.
- Final flush дараа `session:{id}` болон `session_winsched:*` key-үүд арилна.
- `is_order_success` event ирвэл `is_completed_purchase=true` болно.
- `bot_score > BOT_THRESHOLD` event-үүд session-д нэмэгдэхгүй.
