-- Run on Main Service database (NOT Observer).
-- Dedup: same session must not be diagnosed twice (Redis path or DB poll path).

CREATE TABLE IF NOT EXISTS processed_sessions (
    id                   BIGSERIAL PRIMARY KEY,
    observer_session_id  TEXT        NOT NULL,
    visitor_id           TEXT,
    tier                 TEXT,
    processed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_processed_sessions_session UNIQUE (observer_session_id)
);

CREATE INDEX IF NOT EXISTS idx_processed_session_observer
    ON processed_sessions (observer_session_id);

-- Optional: extend with diagnosis payload after you implement Gemini / scores.
-- ALTER TABLE processed_sessions ADD COLUMN diagnosis_json JSONB;
