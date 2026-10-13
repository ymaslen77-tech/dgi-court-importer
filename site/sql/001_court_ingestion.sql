-- Independent ingestion store for large-scale official court metadata.
-- Run against a backed-up PostgreSQL 17 database in a controlled migration.
-- No parties, addresses, excerpts, or machine-generated outcomes are stored here.
CREATE SCHEMA IF NOT EXISTS ingest;
CREATE TABLE IF NOT EXISTS ingest.court_case_instances (
  id BIGSERIAL PRIMARY KEY,
  source_key TEXT NOT NULL UNIQUE,
  court TEXT NOT NULL,
  case_number TEXT NOT NULL,
  case_uid TEXT,
  instance_kind TEXT,
  topic TEXT,
  official_case_url TEXT NOT NULL,
  act_verification TEXT NOT NULL DEFAULT 'metadata_only' CHECK (act_verification IN ('metadata_only', 'source_found', 'editorial_verified')),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT case_number_nonempty CHECK (length(btrim(case_number)) > 0)
);
CREATE INDEX IF NOT EXISTS court_case_uid_idx ON ingest.court_case_instances (case_uid) WHERE case_uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS court_instance_number_idx ON ingest.court_case_instances (case_number);
CREATE INDEX IF NOT EXISTS court_instance_topic_idx ON ingest.court_case_instances (topic);
CREATE INDEX IF NOT EXISTS court_textsearch_idx ON ingest.court_case_instances USING GIN (to_tsvector('russian', coalesce(topic,'') || ' ' || court || ' ' || case_number));
COMMENT ON TABLE ingest.court_case_instances IS 'Unverified official case metadata for editorial review, separate from publishable court acts';
