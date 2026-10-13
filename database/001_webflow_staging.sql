-- Stage imported editorial content; never publish automatically.
-- Apply to a dedicated PostgreSQL database after backup/review.
BEGIN;

CREATE TABLE IF NOT EXISTS webflow_source_pages (
  webflow_id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  seo_title text NOT NULL,
  seo_description text NOT NULL DEFAULT '',
  content_blocks jsonb NOT NULL,
  source_links jsonb NOT NULL DEFAULT '[]'::jsonb,
  migration_state text NOT NULL DEFAULT 'staged'
    CHECK (migration_state IN ('staged','reviewed','ready')),
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS webflow_source_pages_state_idx
  ON webflow_source_pages(migration_state);

CREATE TABLE IF NOT EXISTS webflow_court_archive (
  webflow_id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  case_number text NOT NULL DEFAULT '',
  court_name text NOT NULL DEFAULT '',
  subject text NOT NULL DEFAULT '',
  official_source_url text,
  verification_status text NOT NULL DEFAULT 'unverified',
  act_reviewed boolean NOT NULL DEFAULT false,
  was_published boolean NOT NULL DEFAULT false,
  was_draft boolean NOT NULL DEFAULT true,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS court_archive_number_idx
  ON webflow_court_archive(case_number);
CREATE INDEX IF NOT EXISTS court_archive_court_idx
  ON webflow_court_archive(court_name);

CREATE TABLE IF NOT EXISTS court_case_instances (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_system text NOT NULL,
  external_id text NOT NULL,
  case_uid text,
  case_number text,
  court_name text,
  official_url text,
  review_state text NOT NULL DEFAULT 'metadata_only'
    CHECK (review_state IN ('metadata_only','review_pending','verified','rejected')),
  captured_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(source_system, external_id)
);
CREATE INDEX IF NOT EXISTS court_case_instances_uid_idx ON court_case_instances(case_uid);
CREATE INDEX IF NOT EXISTS court_case_instances_number_idx ON court_case_instances(case_number);

COMMIT;
