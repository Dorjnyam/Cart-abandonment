---
id: troubleshooting
title: Session — Алдааны шийдэл
sidebar_label: Troubleshooting
---

# Алдааны шийдэл

| Алдааны шинж | Шалтгаан | Шийдэл |
|-------------|----------|--------|
| `timers_scheduled = 0` | Celery worker ажиллахгүй | Worker асаасан эсэхийг шалгах |
| `enriched_emitted = 0` | Kafka хүрч чадахгүй | `enriched_emit_failed` counter шалгах |
| `unregistered task` алдаа | Worker celery_app.py ачаалаагүй | Зөв `celery_app.py` ашиглах |
| Давхардсан event | Dedup тохиргоогүй | `SESSION_DEDUPE_EVENT_ID=1` |

## Эхлээд шалгах

```bash
# Health
curl http://localhost:8002/health

# Telemetry
curl http://localhost:8002/viewer/status

# Manual flush
curl -X POST http://localhost:8002/ingest/flush-session \
  -H "Content-Type: application/json" \
  -d '{"session_id":"<uuid>"}'
```
