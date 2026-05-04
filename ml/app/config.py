from pydantic import AliasChoices, Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

CATEGORICAL_ENCODINGS: dict[str, dict[str, int]] = {
    "device_type":    {"desktop": 0, "mobile": 1, "tablet": 2},
    "customer_type":  {"guest": 0, "registered": 1, "vip": 2},
    "payment_method": {"qpay": 0, "socialpay": 1, "card": 2, "cash": 3},
    "end_reason":     {"timeout": 0, "unload": 1, "purchase": 2},
    "language":       {},  # fallback: hash(val) % 100
}


class Settings(BaseSettings):
    # Kafka
    kafka_bootstrap_servers: str = Field(
        default="kafka:9092",
        validation_alias=AliasChoices("KAFKA_BOOTSTRAP_SERVERS", "KAFKA_BOOTSTRAP"),
    )
    kafka_input_topic: str = "feature_ready"
    kafka_output_topic: str = "prediction_done"
    kafka_output_topic_v2: str = "prediction_done_v2"
    kafka_consumer_group: str = "ml-svc-group"
    kafka_auto_offset_reset: str = "earliest"
    kafka_dlq_topic: str = "prediction_dlq"

    # PostgreSQL
    pg_dsn: str

    @property
    def pg_dsn_asyncpg(self) -> str:
        """Normalize DSN for asyncpg (remove SQLAlchemy-style +asyncpg driver spec)."""
        dsn = self.pg_dsn
        if "postgresql+asyncpg://" in dsn:
            dsn = dsn.replace("postgresql+asyncpg://", "postgresql://")
        elif "postgres+asyncpg://" in dsn:
            dsn = dsn.replace("postgres+asyncpg://", "postgres://")
        return dsn

    # MinIO / S3 model storage — leave minio_endpoint empty to skip download
    minio_endpoint: str = ""
    minio_access_key: str = ""
    minio_secret_key: str = ""
    minio_bucket: str = "models"
    minio_secure: bool = False

    # Models — legacy single-path + ablation variant paths
    model_path_xgboost: str = "./models/model_v1_xgboost.pkl"
    model_path_xgboost_baseline: str = "./models/model_baseline_xgboost.pkl"
    model_path_xgboost_extended: str = "./models/model_extended_xgboost.pkl"
    model_path_xgboost_full: str = "./models/model_full_xgboost.pkl"
    model_path_lstm: str = "./models/model_v1_lstm.pt"
    model_version_xgboost: str = "xgboost-v1"
    model_version_lstm: str = "lstm-v1"
    shap_background_samples: int = 100
    shap_top_n: int = 10
    shap_enabled: bool = True  # set SHAP_ENABLED=false to skip SHAP in prod

    # Ablation study variant: full | extended | baseline
    model_variant: str = "full"

    # Prediction
    abandon_threshold: float = 0.5
    lstm_min_sequence_length: int = 4
    ensemble_weight_xgboost: float = 0.7
    ensemble_weight_lstm: float = 0.3

    # Concurrency
    max_concurrent_inferences: int = 4
    inference_thread_workers: int = 4

    model_config = SettingsConfigDict(env_file=".env")

    @model_validator(mode="after")
    def _check_ensemble_weights(self) -> "Settings":
        total = self.ensemble_weight_xgboost + self.ensemble_weight_lstm
        if abs(total - 1.0) > 1e-6:
            raise ValueError(
                f"ENSEMBLE_WEIGHT_XGBOOST + ENSEMBLE_WEIGHT_LSTM must equal 1.0, got {total:.4f}"
            )
        return self


settings = Settings()
