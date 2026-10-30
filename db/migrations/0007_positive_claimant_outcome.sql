-- Publication gate: the independent judicial catalog contains ONLY claimant victories.
-- Metadata-only or claimant-losing decisions are never public regardless of appellate wording.
BEGIN;
ALTER TABLE court_act_documents
  ADD COLUMN IF NOT EXISTS claimant_outcome text NOT NULL DEFAULT 'unreviewed'
    CHECK (claimant_outcome IN ('unreviewed','applicant_granted','applicant_partially_granted','applicant_denied','uncertain'));
ALTER TABLE court_act_documents
  ADD COLUMN IF NOT EXISTS outcome_checked_at timestamptz,
  ADD COLUMN IF NOT EXISTS outcome_reviewed_by text,
  ADD COLUMN IF NOT EXISTS outcome_evidence text;
ALTER TABLE court_act_documents DROP CONSTRAINT IF EXISTS court_act_positive_public_guard;
ALTER TABLE court_act_documents
  ADD CONSTRAINT court_act_positive_public_guard CHECK (
    status <> 'published' OR (
      claimant_outcome IN ('applicant_granted','applicant_partially_granted')
      AND outcome_checked_at IS NOT NULL
      AND length(btrim(coalesce(outcome_reviewed_by,''))) >= 3
      AND length(btrim(coalesce(outcome_evidence,''))) >= 40
    )
  );
-- Revoke approval whenever positive classification is changed.
CREATE OR REPLACE FUNCTION court_act_revoke_favorable_outcome()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'published' AND (
     NEW.claimant_outcome IS DISTINCT FROM OLD.claimant_outcome OR
     NEW.outcome_evidence IS DISTINCT FROM OLD.outcome_evidence) THEN
    NEW.status := 'review';
    NEW.reviewed_by := NULL;
    NEW.published_at := NULL;
    NEW.source_checked_at := NULL;
    NEW.text_verified_at := NULL;
    NEW.privacy_checked_at := NULL;
    NEW.outcome_checked_at := NULL;
    NEW.outcome_reviewed_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS court_act_positive_review_revoke ON court_act_documents;
CREATE TRIGGER court_act_positive_review_revoke
BEFORE UPDATE ON court_act_documents
FOR EACH ROW EXECUTE FUNCTION court_act_revoke_favorable_outcome();
COMMIT;
