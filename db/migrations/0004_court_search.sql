-- Indexed Russian-language court metadata search, stage-only.
-- Apply after 0001_initial.sql. This does not publish legal judgments.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS court_instances_case_number_trgm_idx
 ON court_instances USING gin (case_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS court_instances_court_name_trgm_idx
 ON court_instances USING gin (court_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS court_cases_topic_trgm_idx
 ON court_cases USING gin (topic gin_trgm_ops);
CREATE INDEX IF NOT EXISTS court_cases_topic_fts_idx
 ON court_cases USING gin (to_tsvector('russian', topic));
CREATE INDEX IF NOT EXISTS court_instances_court_fts_idx
 ON court_instances USING gin (to_tsvector('russian', court_name));
CREATE INDEX IF NOT EXISTS court_instances_cursor_idx
 ON court_instances (case_id, id);
COMMIT;
