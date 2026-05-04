import io
from datetime import date
from typing import Literal

import boto3
from django.conf import settings


def _client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{settings.MINIO_ENDPOINT}" if settings.MINIO_USE_SSL else f"http://{settings.MINIO_ENDPOINT}",
        aws_access_key_id=settings.MINIO_ACCESS_KEY,
        aws_secret_access_key=settings.MINIO_SECRET_KEY,
    )


def export_bytes(content: bytes, export_type: Literal["sessions", "analytics"], suffix: str = "parquet") -> str:
    today = date.today().isoformat()
    key = f"{today}_{export_type}.{suffix}"

    client = _client()
    client.put_object(Bucket=settings.MINIO_BUCKET, Key=key, Body=io.BytesIO(content))
    return key

