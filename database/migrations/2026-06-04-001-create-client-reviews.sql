BEGIN;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS reviews_blocked_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS reviews_blocked_reason TEXT;

CREATE TABLE IF NOT EXISTS client_reviews (
  id BIGSERIAL PRIMARY KEY,

  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  eligibility_session_id BIGINT REFERENCES sessions(id) ON DELETE SET NULL,

  public_name TEXT,
  rating INTEGER,
  text TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT,
  source TEXT NOT NULL DEFAULT 'website',

  consent_accepted BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  hidden_at TIMESTAMP WITH TIME ZONE,
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT client_reviews_rating_check
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),

  CONSTRAINT client_reviews_text_length_check
    CHECK (length(trim(text)) BETWEEN 10 AND 2000),

  CONSTRAINT client_reviews_public_name_length_check
    CHECK (public_name IS NULL OR length(trim(public_name)) <= 80),

  CONSTRAINT client_reviews_status_check
    CHECK (status IN ('pending', 'published', 'hidden', 'deleted')),

  CONSTRAINT client_reviews_source_check
    CHECK (source IN ('website', 'admin')),

  CONSTRAINT client_reviews_admin_note_length_check
    CHECK (admin_note IS NULL OR length(trim(admin_note)) <= 500)
);

CREATE TABLE IF NOT EXISTS review_reward_codes (
  id BIGSERIAL PRIMARY KEY,

  review_id BIGINT NOT NULL UNIQUE REFERENCES client_reviews(id) ON DELETE CASCADE,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  code TEXT NOT NULL UNIQUE,
  discount_percent INTEGER NOT NULL DEFAULT 25,
  applies_to TEXT NOT NULL DEFAULT 'single_service',
  status TEXT NOT NULL DEFAULT 'active',

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  used_payment_id BIGINT,

  CONSTRAINT review_reward_codes_discount_percent_check
    CHECK (discount_percent > 0 AND discount_percent <= 100),

  CONSTRAINT review_reward_codes_applies_to_check
    CHECK (applies_to = 'single_service'),

  CONSTRAINT review_reward_codes_status_check
    CHECK (status IN ('active', 'used', 'cancelled')),

  CONSTRAINT review_reward_codes_code_length_check
    CHECK (length(trim(code)) BETWEEN 6 AND 64),

  CONSTRAINT review_reward_codes_used_state_check
    CHECK (
      (status = 'used' AND used_at IS NOT NULL)
      OR
      (status <> 'used')
    )
);

CREATE INDEX IF NOT EXISTS idx_clients_reviews_blocked_at
  ON clients (reviews_blocked_at)
  WHERE reviews_blocked_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_reviews_client_id_created_at
  ON client_reviews (client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_reviews_status_created_at
  ON client_reviews (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_reviews_public
  ON client_reviews (published_at DESC, id DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_client_reviews_eligibility_session_id
  ON client_reviews (eligibility_session_id)
  WHERE eligibility_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_review_reward_codes_client_id
  ON review_reward_codes (client_id);

CREATE INDEX IF NOT EXISTS idx_review_reward_codes_status_created_at
  ON review_reward_codes (status, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS ux_review_reward_codes_one_non_cancelled_per_client
  ON review_reward_codes (client_id)
  WHERE status <> 'cancelled';

COMMIT;