from main_service.settings import *  # noqa: F403

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

DUCKDB_PATH = ":memory:"

DATABASES["default"] = {  # noqa: F405
    "ENGINE": "django.db.backends.sqlite3",
    "NAME": ":memory:",
}
DATABASES["observer"] = DATABASES["default"]  # noqa: F405
