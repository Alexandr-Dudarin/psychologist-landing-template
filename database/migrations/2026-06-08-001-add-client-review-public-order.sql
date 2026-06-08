BEGIN;

ALTER TABLE client_reviews
  ADD COLUMN IF NOT EXISTS public_order INTEGER;

WITH ordered_reviews AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY
        published_at DESC NULLS LAST,
        created_at DESC,
        id DESC
    ) AS next_public_order
  FROM client_reviews
  WHERE status = 'published'
    AND deleted_at IS NULL
)
UPDATE client_reviews r
SET public_order = ordered_reviews.next_public_order
FROM ordered_reviews
WHERE r.id = ordered_reviews.id
  AND r.public_order IS NULL;

CREATE INDEX IF NOT EXISTS idx_client_reviews_public_order
  ON client_reviews (
    public_order ASC NULLS LAST,
    published_at DESC,
    created_at DESC,
    id DESC
  )
  WHERE status = 'published'
    AND deleted_at IS NULL;

COMMIT;