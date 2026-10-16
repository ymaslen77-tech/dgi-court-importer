-- Schema baseline. Review and apply manually to a dedicated PostgreSQL database.
-- Not used automatically by the current public site or Python importers.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS editorial_pages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    kind text NOT NULL CHECK (kind IN ('landing', 'guide', 'news', 'normative')),
    title text NOT NULL,
    seo_title text NOT NULL,
    seo_description text NOT NULL DEFAULT '',
    body jsonb NOT NULL DEFAULT '[]'::jsonb,
    editorial_status text NOT NULL DEFAULT 'draft'
      CHECK (editorial_status IN ('draft', 'review', 'verified', 'published', 'archived')),
    source_url text,
    checked_at timestamptz,
    published_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS editorial_pages_status_idx ON editorial_pages (editorial_status, published_at);

CREATE TABLE IF NOT EXISTS court_cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stable_key text NOT NULL UNIQUE,
    uid text,
    topic text NOT NULL DEFAULT 'Требует классификации',
    editorial_status text NOT NULL DEFAULT 'candidate'
      CHECK (editorial_status IN ('candidate', 'review', 'verified', 'published', 'rejected')),
    summary text,
    act_verified boolean NOT NULL DEFAULT false,
    last_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS court_cases_uid_idx ON court_cases (uid);

CREATE TABLE IF NOT EXISTS court_instances (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES court_cases(id) ON DELETE CASCADE,
    court_name text NOT NULL,
    case_number text NOT NULL,
    instance_type text CHECK (instance_type IN ('first', 'appeal', 'cassation', 'supervisory', 'unknown')),
    status_text text,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (case_id, court_name, case_number)
);
CREATE INDEX IF NOT EXISTS court_instances_court_number_idx ON court_instances (court_name, case_number);

CREATE TABLE IF NOT EXISTS court_sources (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id uuid NOT NULL REFERENCES court_instances(id) ON DELETE CASCADE,
    source_url text NOT NULL,
    publisher text NOT NULL,
    source_type text NOT NULL CHECK (source_type IN ('court_card', 'court_act', 'secondary')),
    document_checked boolean NOT NULL DEFAULT false,
    checked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (instance_id, source_url)
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline text NOT NULL,
    status text NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
    source_url text,
    seen_count integer NOT NULL DEFAULT 0,
    inserted_count integer NOT NULL DEFAULT 0,
    error_summary text,
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz
);
COMMIT;
