ALTER TABLE payments
ADD COLUMN IF NOT EXISTS payment_kind TEXT NOT NULL DEFAULT 'booking';

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS package_purchase_payload JSONB;

ALTER TABLE payments
ADD COLUMN IF NOT EXISTS client_package_id BIGINT NULL
REFERENCES client_service_packages(id) ON DELETE SET NULL;

ALTER TABLE payments
ALTER COLUMN booking_payload DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_payment_kind_check'
  ) THEN
    ALTER TABLE payments
    ADD CONSTRAINT payments_payment_kind_check
    CHECK (payment_kind IN ('booking', 'service_package'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payments_payload_by_kind_check'
  ) THEN
    ALTER TABLE payments
    ADD CONSTRAINT payments_payload_by_kind_check
    CHECK (
      (
        payment_kind = 'booking'
        AND booking_payload IS NOT NULL
      )
      OR
      (
        payment_kind = 'service_package'
        AND package_purchase_payload IS NOT NULL
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS payments_payment_kind_idx
  ON payments(payment_kind);

CREATE INDEX IF NOT EXISTS payments_client_package_id_idx
  ON payments(client_package_id);