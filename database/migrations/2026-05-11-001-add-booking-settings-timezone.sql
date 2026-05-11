ALTER TABLE booking_settings
ADD COLUMN IF NOT EXISTS timezone TEXT;

ALTER TABLE booking_settings
ALTER COLUMN timezone SET DEFAULT 'Europe/Moscow';

UPDATE booking_settings
SET timezone = 'Europe/Moscow'
WHERE timezone IS NULL OR BTRIM(timezone) = '';

UPDATE booking_settings
SET timezone = 'Europe/Moscow'
WHERE id = 1;

ALTER TABLE booking_settings
ALTER COLUMN timezone SET NOT NULL;
