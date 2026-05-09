BEGIN;

CREATE TABLE IF NOT EXISTS session_reminder_deliveries (
  id BIGSERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (
    reminder_type IN (
      'specialist_1h',
      'specialist_24h',
      'client_1h',
      'client_24h'
    )
  ),
  channel TEXT NOT NULL CHECK (
    channel IN (
      'telegram',
      'owner_email',
      'client_email'
    )
  ),
  status TEXT NOT NULL CHECK (
    status IN (
      'sent',
      'failed',
      'skipped'
    )
  ),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS session_reminder_unique_delivery_idx
  ON session_reminder_deliveries (session_id, reminder_type, channel);

COMMIT;