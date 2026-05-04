import os

from celery import Celery


# Celery app bootstrap.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main_service.settings')

app = Celery('main_service')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

