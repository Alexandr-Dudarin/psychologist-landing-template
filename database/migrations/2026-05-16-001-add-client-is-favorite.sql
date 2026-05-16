ALTER TABLE clients
ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

UPDATE clients
SET is_favorite = false
WHERE status <> 'active';