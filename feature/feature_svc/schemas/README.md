# schemas/

`feature_ready.json` is the contract between Feature Service (producer) and ML Prediction Service (consumer) for messages on the `feature_ready` Kafka topic.

When you add, remove, or rename fields in `FeatureSet` (`models.py`), update `feature_ready.json` and bump `EXPECTED_FEATURE_COUNT` in `features/__init__.py` in the same commit.
