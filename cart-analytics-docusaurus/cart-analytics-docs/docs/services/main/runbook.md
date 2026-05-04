---
id: runbook
title: Main — Runbook
sidebar_label: Runbook
---

# Runbook

## Аюулгүй дахин эхлүүлэх

```bash
# Django restart
pkill -f "python manage.py runserver"
python manage.py runserver &

# Celery worker restart
pkill -f "celery worker"
celery -A main_service.celery:app worker -l info &
```

## DB Migration

```bash
python manage.py migrate
# Additive migration-д аюулгүй — service ажиллаж байхад хийж болно
```

## Rollback

```bash
python manage.py migrate <app_name> <previous_migration>
git checkout <good_commit>
python manage.py runserver
```

## Export (MinIO)

```bash
# Manual export trigger
curl -X POST http://localhost:8000/api/export/ \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

## Observer DB polling шалгах

```bash
# Observer DB холболт шалгах
python manage.py shell -c "
from django.db import connections
conn = connections['observer']
conn.ensure_connection()
print('Observer DB: OK')
"
```
