CREATE TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  action_key TEXT NOT NULL,
  identifier_hash TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rate_limits_request_count_positive
    CHECK (request_count > 0),

  CONSTRAINT rate_limits_unique_window
    UNIQUE (action_key, identifier_hash, window_start)
);

CREATE INDEX IF NOT EXISTS rate_limits_action_window_idx
  ON rate_limits (action_key, window_start);

CREATE INDEX IF NOT EXISTS rate_limits_updated_at_idx
  ON rate_limits (updated_at);