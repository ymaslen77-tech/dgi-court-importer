-- CMS source archive from Webflow. Staging only; never served publicly.
-- Requires db/migrations/0001_initial.sql to be applied first.
BEGIN;
CREATE TABLE IF NOT EXISTS webflow_cms_staging (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    source_collection text NOT NULL CHECK (source_collection IN (
        'dgi-court-cases','dgi-legal-documents','dgi-legal-situations','housing-law-news')),
    source_item_id text NOT NULL CHECK (source_item_id ~ '^[a-f0-9]{24}$'),
    slug text NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
    display_title text NOT NULL,
    source_status text NOT NULL CHECK (source_status IN ('draft','legacy_public_unverified')),
    verified boolean NOT NULL DEFAULT false CHECK (verified = false),
    publication_allowed boolean NOT NULL DEFAULT false CHECK (publication_allowed = false),
    editorial_status text NOT NULL DEFAULT 'review' CHECK (editorial_status = 'review'),
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
    imported_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (source_collection, source_item_id),
    UNIQUE (source_collection, slug)
);
CREATE INDEX IF NOT EXISTS webflow_cms_staging_collection_idx
    ON webflow_cms_staging (source_collection, source_status);
COMMIT;
