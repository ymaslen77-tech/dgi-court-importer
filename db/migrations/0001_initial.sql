-- Migration 0001. No legal outcomes or party identities are inferred from case metadata.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS editorial_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  source_page_id text UNIQUE,
  title text NOT NULL,
  seo_title text NOT NULL,
  seo_description text NOT NULL DEFAULT '',
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','review','published','archived')),
  last_checked_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS editorial_pages_status_idx ON editorial_pages(status);

CREATE TABLE IF NOT EXISTS legal_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_url text,
  source_published_at timestamptz,
  legal_status text NOT NULL DEFAULT 'unverified'
    CHECK (legal_status IN ('unverified','draft_law','in_force','repealed','not_applicable')),
  editorial_status text NOT NULL DEFAULT 'candidate'
    CHECK (editorial_status IN ('candidate','review','verified','published','rejected')),
  primary_act_url text,
  checked_at timestamptz,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS legal_news_status_idx ON legal_news(editorial_status, source_published_at);

CREATE TABLE IF NOT EXISTS courts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL UNIQUE,
  jurisdiction text,
  official_domain text
);

CREATE TABLE IF NOT EXISTS court_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provisional_group_key text NOT NULL UNIQUE,
  uid text,
  topic text,
  status text NOT NULL DEFAULT 'metadata_only'
    CHECK (status IN ('metadata_only','editorial_review','verified','rejected')),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS court_cases_uid_idx ON court_cases(uid) WHERE uid IS NOT NULL;

CREATE TABLE IF NOT EXISTS court_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES court_cases(id) ON DELETE RESTRICT,
  court_id uuid NOT NULL REFERENCES courts(id) ON DELETE RESTRICT,
  source_key text NOT NULL UNIQUE,
  case_number text NOT NULL,
  category text,
  official_case_url text NOT NULL CHECK (official_case_url ~ '^https://'),
  act_status text NOT NULL DEFAULT 'unverified'
    CHECK (act_status IN ('unverified','review','verified')),
  act_published_at date,
  appeal_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS court_instances_case_idx ON court_instances(case_id);
CREATE INDEX IF NOT EXISTS court_instances_num_trgm_idx ON court_instances USING gin(case_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS court_instances_cat_fts_idx ON court_instances USING gin(to_tsvector('russian',coalesce(category,'')));

CREATE TABLE IF NOT EXISTS court_source_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL REFERENCES court_instances(id) ON DELETE CASCADE,
  official_url text NOT NULL CHECK (official_url ~ '^https://'),
  document_type text NOT NULL DEFAULT 'card'
    CHECK (document_type IN ('card','decision','appeal','cassation','other')),
  checked_by text,
  checked_at timestamptz,
  is_primary_text_verified boolean NOT NULL DEFAULT false,
  UNIQUE(instance_id,official_url)
);

CREATE TABLE IF NOT EXISTS import_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  importer text NOT NULL,
  source_url text,
  status text NOT NULL CHECK (status IN ('running','success','failed')),
  scanned integer NOT NULL DEFAULT 0,
  inserted integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

-- Authentication, RBAC and editorial audit logs will be managed through
-- Payload in a later migration. No self-service editing is enabled here.
