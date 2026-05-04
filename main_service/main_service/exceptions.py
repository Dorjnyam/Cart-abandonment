from django.db import OperationalError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    if isinstance(exc, OperationalError):
        return Response(
            {"detail": "Service temporarily unavailable"},
            status=503,
            headers={"Retry-After": "10"},
        )
    return exception_handler(exc, context)
