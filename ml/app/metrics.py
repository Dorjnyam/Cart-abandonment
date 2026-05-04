from prometheus_client import Counter, Gauge, Histogram

messages_consumed = Counter(
    "messages_consumed_total",
    "Total Kafka messages consumed from feature_ready",
)
predictions_produced = Counter(
    "predictions_produced_total",
    "Total predictions successfully published to Kafka",
)
inference_failures = Counter(
    "inference_failures_total",
    "Inference errors labelled by model",
    ["model"],
)
kafka_publish_failures = Counter(
    "kafka_publish_failures_total",
    "Kafka publish failures after all retries exhausted",
)
inference_duration = Histogram(
    "inference_duration_seconds",
    "Wall-clock inference duration labelled by model (xgb / lstm / total)",
    ["model"],
    buckets=[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0],
)
abandonment_probability = Histogram(
    "abandonment_probability",
    "Distribution of final abandonment probability scores (drift detection)",
    buckets=[i / 10 for i in range(11)],
)
active_inference_tasks = Gauge(
    "active_inference_tasks",
    "Number of inference tasks currently in flight",
)
model_version_info = Gauge(
    "model_version_info",
    "Currently loaded model version (label carries the version string)",
    ["version"],
)
