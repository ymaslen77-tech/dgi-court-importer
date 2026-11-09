-- Official, privacy-reviewed PDF copies of judicial acts.
-- This migration neither imports nor publishes a single document.
BEGIN;
CREATE TABLE IF NOT EXISTS court_act_pdf_assets (
  court_act_document_id uuid PRIMARY KEY REFERENCES court_act_documents(id) ON DELETE RESTRICT,
  official_pdf_url text NOT NULL
    CHECK (official_pdf_url ~ '^https://[^[:space:]]+$'),
  pdf_bytes bytea NOT NULL
    CHECK (octet_length(pdf_bytes) BETWEEN 300 AND 15728640
      AND substring(pdf_bytes from 1 for 5)=decode('255044462d','hex')),
  pdf_sha256 text GENERATED ALWAYS AS (encode(digest(pdf_bytes,'sha256'),'hex')) STORED,
  source_checked_at timestamptz,
  privacy_checked_at timestamptz,
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT court_pdf_approval_guard CHECK (
    approved_at IS NULL OR (
      source_checked_at IS NOT NULL AND privacy_checked_at IS NOT NULL
      AND length(btrim(coalesce(approved_by,'')))>=3
    )
  )
);
CREATE OR REPLACE FUNCTION revoke_court_pdf_approval()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.official_pdf_url IS DISTINCT FROM OLD.official_pdf_url OR
     NEW.pdf_bytes IS DISTINCT FROM OLD.pdf_bytes THEN
    NEW.source_checked_at := NULL;
    NEW.privacy_checked_at := NULL;
    NEW.approved_by := NULL;
    NEW.approved_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS revoke_court_pdf_approval_trigger ON court_act_pdf_assets;
CREATE TRIGGER revoke_court_pdf_approval_trigger
BEFORE UPDATE ON court_act_pdf_assets
FOR EACH ROW EXECUTE FUNCTION revoke_court_pdf_approval();
COMMIT;
