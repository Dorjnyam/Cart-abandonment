from __future__ import annotations

import time
from collections import deque
from typing import Any

MAX_EVENTS = 500
_events: deque[dict[str, Any]] = deque(maxlen=MAX_EVENTS)
_seq = 0
_stats: dict[str, int] = {
    "raw_received": 0,
    "http_received": 0,
    "bot_skipped": 0,
    "duplicate_skipped": 0,
    "accumulated": 0,
    "timers_scheduled": 0,
    "enriched_emitted": 0,
    "enriched_emit_failed": 0,
    "final_flushed": 0,
    "pg_written": 0,
    "monitor_enriched_seen": 0,
}


def record_event(stage: str, details: dict[str, Any] | None = None) -> None:
    global _seq
    _seq += 1
    _stats[stage] = _stats.get(stage, 0) + 1
    _events.append(
        {
            "seq": _seq,
            "ts": time.time(),
            "stage": stage,
            "details": details or {},
        }
    )


def get_events_since(since_seq: int = 0) -> list[dict[str, Any]]:
    return [event for event in _events if int(event["seq"]) > since_seq]


def get_snapshot() -> dict[str, Any]:
    last_seq = _events[-1]["seq"] if _events else 0
    return {"last_seq": last_seq, "stats": _stats.copy()}
