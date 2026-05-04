-- Migration 002: align sessions.sessions schema with spec
-- Safe to run on existing DB: uses IF NOT EXISTS / IF EXISTS guards.

BEGIN;

ALTER TABLE sessions.sessions
    ADD COLUMN IF NOT EXISTS page_views          integer      NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS abandoned           boolean      NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS end_reason          text;

-- Rename session_duration_sec if it does not already carry a generated peer.
-- duration_ms is a generated column; add only if absent.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'sessions'
          AND table_name   = 'sessions'
          AND column_name  = 'duration_ms'
    ) THEN
        ALTER TABLE sessions.sessions
            ADD COLUMN duration_ms bigint
                GENERATED ALWAYS AS (session_duration_sec * 1000) STORED;
    END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS sessions_visitor_id_idx ON sessions.sessions (visitor_id);
CREATE INDEX IF NOT EXISTS sessions_started_at_idx ON sessions.sessions (started_at);

COMMIT;
