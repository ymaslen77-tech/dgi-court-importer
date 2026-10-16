-- Stage 4: database-enforced editorial publication prerequisites.
-- Apply to the isolated migration database after 0001 and 0002.
-- This is not a substitute for Payload authentication and RBAC.
BEGIN;
ALTER TABLE editorial_pages ADD COLUMN IF NOT EXISTS reviewed_by text;
ALTER TABLE editorial_pages
  ADD CONSTRAINT editorial_pages_publication_guard
  CHECK (
    editorial_status <> 'published'
    OR (
      checked_at IS NOT NULL
      AND published_at IS NOT NULL
      AND reviewed_by IS NOT NULL
      AND length(btrim(reviewed_by)) >= 3
    )
  );

-- Any substantive change to approved content revokes approval and publication.
CREATE OR REPLACE FUNCTION editorial_pages_invalidate_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title
     OR NEW.seo_title IS DISTINCT FROM OLD.seo_title
     OR NEW.seo_description IS DISTINCT FROM OLD.seo_description
     OR NEW.body IS DISTINCT FROM OLD.body
     OR NEW.source_url IS DISTINCT FROM OLD.source_url
  THEN
    NEW.checked_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.published_at := NULL;
    IF NEW.editorial_status = 'published' THEN
      NEW.editorial_status := 'review';
    END IF;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS editorial_pages_invalidate_review_trigger ON editorial_pages;
CREATE TRIGGER editorial_pages_invalidate_review_trigger
BEFORE UPDATE ON editorial_pages
FOR EACH ROW EXECUTE FUNCTION editorial_pages_invalidate_review();
COMMIT;
