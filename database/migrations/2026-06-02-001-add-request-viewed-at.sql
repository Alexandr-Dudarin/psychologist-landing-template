ALTER TABLE requests
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ NULL;

UPDATE requests
SET viewed_at = created_at
WHERE viewed_at IS NULL;

CREATE INDEX IF NOT EXISTS requests_viewed_at_idx
  ON requests(viewed_at);

CREATE INDEX IF NOT EXISTS requests_unviewed_created_at_idx
  ON requests(created_at DESC)
  WHERE viewed_at IS NULL;