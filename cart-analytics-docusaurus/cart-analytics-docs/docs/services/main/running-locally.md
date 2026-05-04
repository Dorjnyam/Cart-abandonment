---
id: running-locally
title: Main — Локалд ажиллуулах
sidebar_label: Локалд ажиллуулах
---

# Локалд ажиллуулах

```bash
# 1. Dependency суулгах
pip install -r requirements.txt

# 2. .env тохируулах
cp .env.example .env
# DB credentials, Redis URL гэх мэт тохируулна

# 3. Migration хийх
python manage.py makemigrations
python manage.py migrate

# 4. Superuser үүсгэх
python manage.py createsuperuser

# 5. Web server
python manage.py runserver
# http://localhost:8000

# 6. Celery worker (тусдаа terminal)
celery -A main_service.celery:app worker -l info

# 7. Celery beat (тусдаа terminal)
celery -A main_service.celery:app beat -l info

# 8. Kafka consumer (тусдаа terminal)
python manage.py consume_prediction_done
```

**Локал URL:** http://localhost:8000
