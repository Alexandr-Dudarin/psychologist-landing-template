ALTER TABLE clients
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_value TEXT;

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT,
ADD COLUMN IF NOT EXISTS preferred_contact_value TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'clients_preferred_contact_method_check'
  ) THEN
    ALTER TABLE clients
    ADD CONSTRAINT clients_preferred_contact_method_check
    CHECK (
      preferred_contact_method IS NULL
      OR preferred_contact_method IN ('whatsapp', 'telegram', 'email', 'sms', 'vk')
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'requests_preferred_contact_method_check'
  ) THEN
    ALTER TABLE requests
    ADD CONSTRAINT requests_preferred_contact_method_check
    CHECK (
      preferred_contact_method IS NULL
      OR preferred_contact_method IN ('whatsapp', 'telegram', 'email', 'sms', 'vk')
    );
  END IF;
END $$;
