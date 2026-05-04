from datetime import datetime, timezone

from features.temporal import temporal_features


def test_temporal_features_normal() -> None:
    started_at = datetime(2026, 3, 15, 14, 30, tzinfo=timezone.utc)
    events = [{"timestamp": "2026-03-15T14:30:15+00:00"}]
    result = temporal_features(started_at, events)
    assert result["time_to_first_action_ms"] == 15_000.0


def test_temporal_features_zero_input() -> None:
    started_at = datetime(2026, 3, 15, 14, 30, tzinfo=timezone.utc)
    result = temporal_features(started_at, [])
    assert result["time_to_first_action_ms"] == 0.0


def test_temporal_features_partial_window() -> None:
    started_at = datetime(2026, 3, 15, 14, 30, tzinfo=timezone.utc)
    events = [{"timestamp": "2026-03-15T14:30:01+00:00"}]
    result = temporal_features(started_at, events)
    assert result["time_to_first_action_ms"] == 1_000.0
