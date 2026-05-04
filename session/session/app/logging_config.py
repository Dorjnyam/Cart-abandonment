from __future__ import annotations

import json
import logging
import time


class JsonFormatter(logging.Formatter):
    """Emit one JSON object per log line for structured log aggregators."""

    _EXTRA_KEYS = frozenset({"session_id", "event_type", "correlation_id"})

    def format(self, record: logging.LogRecord) -> str:
        obj: dict = {
            "ts": time.time(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }
        if record.exc_info:
            obj["exc"] = self.formatException(record.exc_info)
        for key in self._EXTRA_KEYS:
            if hasattr(record, key):
                obj[key] = getattr(record, key)
        return json.dumps(obj)


def configure_logging(level: int = logging.INFO) -> None:
    handler = logging.StreamHandler()
    handler.setFormatter(JsonFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)
