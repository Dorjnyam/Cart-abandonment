"""
Central settings loaded once at startup via pydantic-settings.

All environment variables are declared here. Modules import `settings`
instead of calling os.getenv() directly, so a missing required variable
raises ValidationError at startup rather than silently defaulting mid-request.
"""

from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Required ──────────────────────────────────────────────────────────────
    database_url: str

    # ── Optional fan-outs ─────────────────────────────────────────────────────
    kafka_bootstrap_servers: str = ""
    redis_url: str = ""
    session_service_url: str = ""
    session_service_api_key: str = ""
    session_service_timeout_ms: int = 1500

    # ── Auth & CORS ───────────────────────────────────────────────────────────
    observer_cors_origins: str = ""        # must be set explicitly; no wildcard default
    observer_api_keys: str = ""
    observer_admin_key: str = ""

    # ── DB pool tuning ────────────────────────────────────────────────────────
    db_pool_min_size: int = 2
    db_pool_max_size: int = 10
    db_pool_max_lifetime: int = 3600
    db_pool_max_inactive_lifetime: int = 300

    # ── Kafka tuning ──────────────────────────────────────────────────────────
    kafka_request_timeout_ms: int = 5000

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
