import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "main_service.settings_test")

import django  # noqa: E402

django.setup()

try:
    import pytest_django  # noqa: F401
except ImportError:
    from django.core.management import call_command  # noqa: E402

    call_command("migrate", run_syncdb=True, verbosity=0)
