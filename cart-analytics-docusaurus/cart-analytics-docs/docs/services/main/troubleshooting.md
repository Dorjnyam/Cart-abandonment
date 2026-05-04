---
id: troubleshooting
title: Main — Алдааны шийдэл
sidebar_label: Troubleshooting
---

# Алдааны шийдэл

| Нөхцөл | HTTP | Шийдэл |
|--------|------|--------|
| Observer DB тохиргоогүй | — | Graceful fallback, `visitor_id='unknown'` |
| Gemini API key байхгүй | — | Static Монгол recommendation текст |
| Celery task алдаа | — | 3 retry, exponential backoff (2s base) |
| Давхардсан session | — | `ProcessedSession` idempotency guard |
| Developer recommendation хэрэгжүүлэх | 403 | Permission denied |
| Refresh token буруу | 400 | `{"detail": "refresh token is required"}` |

## Эхлээд шалгах

```bash
# Health
curl http://localhost:8000/api/health/

# Celery task log шалгах
# Celery worker terminal output

# ProcessedSession шалгах (idempotency)
python manage.py shell -c "from analytics.models import ProcessedSession; print(ProcessedSession.objects.count())"

# Diagnosis амжилттай хийгдсэн эсэх
python manage.py shell -c "from analytics.models import Diagnosis; print(Diagnosis.objects.filter(status='failed').count())"
```
