-- Stage-only, full-text on-site judicial act storage. Apply after 0001_initial.sql.
-- This migration does not ingest or publish any court decision.
BEGIN;
CREATE TABLE IF NOT EXISTS court_act_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,159}$'),
  case_id uuid NOT NULL REFERENCES court_cases(id) ON DELETE RESTRICT,
  instance_id uuid NOT NULL REFERENCES court_instances(id) ON DELETE RESTRICT,
  case_number text NOT NULL CHECK (length(btrim(case_number)) >= 4),
  uid text,
  court_name text NOT NULL CHECK (length(btrim(court_name)) >= 5),
  instance_type text NOT NULL CHECK (instance_type IN ('first','appeal','cassation','supervisory','unknown')),
  decision_date date NOT NULL,
  act_type text NOT NULL CHECK (act_type IN ('decision','ruling','judgment','order','other')),
  topic text NOT NULL CHECK (length(btrim(topic)) >= 4),
  -- Exact text of the court's already publicly disclosed/redacted act, not a summary or snippet.
  full_text text NOT NULL CHECK (length(btrim(full_text)) >= 400 AND length(full_text) <= 2000000),
  full_text_sha256 text GENERATED ALWAYS AS (encode(digest(full_text, 'sha256'), 'hex')) STORED,
  official_url text NOT NULL CHECK (official_url ~ '^https://[^[:space:]]+$'),
  -- Local object-storage key may link to an approved copy of the official PDF.
  -- Never publish a local attachment unless its data and rights have been checked.
  local_attachment_key text,
  seo_title text NOT NULL DEFAULT '',
  seo_description text NOT NULL DEFAULT '',
  editor_note text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','published','withdrawn')),
  source_checked_at timestamptz,
  text_verified_at timestamptz,
  privacy_checked_at timestamptz,
  reviewed_by text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT court_act_published_guard CHECK (
    status <> 'published' OR (
      source_checked_at IS NOT NULL AND text_verified_at IS NOT NULL
      AND privacy_checked_at IS NOT NULL AND published_at IS NOT NULL
      AND length(btrim(coalesce(reviewed_by,''))) >= 3
      AND length(btrim(seo_title)) >= 20 AND length(btrim(seo_description)) >= 60
      AND length(btrim(editor_note)) >= 70
    )
  ),
  UNIQUE(instance_id, official_url)
);
CREATE INDEX IF NOT EXISTS court_act_documents_published_idx
 ON court_act_documents (status,published_at,decision_date DESC,id);
CREATE INDEX IF NOT EXISTS court_act_documents_case_idx
 ON court_act_documents (case_id,decision_date DESC);
CREATE INDEX IF NOT EXISTS court_act_documents_text_fts_idx
 ON court_act_documents USING gin (to_tsvector('russian',full_text));
CREATE INDEX IF NOT EXISTS court_act_documents_topic_fts_idx
 ON court_act_documents USING gin (to_tsvector('russian',topic || ' ' || editor_note));

-- A substantive edit to the text, source, act metadata or editorial SEO fields
-- invalidates all prior approvals and removes the record from the public result set.
CREATE OR REPLACE FUNCTION court_act_revoke_on_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.slug IS DISTINCT FROM OLD.slug OR
    NEW.case_id IS DISTINCT FROM OLD.case_id OR
    NEW.instance_id IS DISTINCT FROM OLD.instance_id OR
    NEW.case_number IS DISTINCT FROM OLD.case_number OR
    NEW.uid IS DISTINCT FROM OLD.uid OR
    NEW.court_name IS DISTINCT FROM OLD.court_name OR
    NEW.instance_type IS DISTINCT FROM OLD.instance_type OR
    NEW.decision_date IS DISTINCT FROM OLD.decision_date OR
    NEW.act_type IS DISTINCT FROM OLD.act_type OR
    NEW.topic IS DISTINCT FROM OLD.topic OR
    NEW.full_text IS DISTINCT FROM OLD.full_text OR
    NEW.official_url IS DISTINCT FROM OLD.official_url OR
    NEW.local_attachment_key IS DISTINCT FROM OLD.local_attachment_key OR
    NEW.seo_title IS DISTINCT FROM OLD.seo_title OR
    NEW.seo_description IS DISTINCT FROM OLD.seo_description OR
    NEW.editor_note IS DISTINCT FROM OLD.editor_note
 THEN
    NEW.source_checked_at := NULL;
    NEW.text_verified_at := NULL;
    NEW.privacy_checked_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.published_at := NULL;
    NEW.status := 'review';
 END IF;
 NEW.updated_at := now();
 RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS court_act_revoke_on_change_trigger ON court_act_documents;
CREATE TRIGGER court_act_revoke_on_change_trigger
BEFORE UPDATE ON court_act_documents
FOR EACH ROW EXECUTE FUNCTION court_act_revoke_on_change();
COMMIT;
