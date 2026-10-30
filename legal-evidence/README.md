# DGI: official legal source verification

Changes to legal instructions require **no routine human sign-off**, but must pass a verifiable official-source gate before production.

Each Pull Request that changes an existing legal paragraph or heading in apps/web/src/data/pages-0.json through pages-5.json must include `legal-evidence/changes.json` in the same PR:

```json
{
  "version": 1,
  "changes": [{
    "file": "apps/web/src/data/pages-0.json",
    "slug": "privatizaciya-zhilya",
    "block_index": 2,
    "before": "The exact existing text, without abbreviating.",
    "after": "The exact replacement text, without abbreviating.",
    "official_source_url": "https://publication.pravo.gov.ru/document/EXACT_OFFICIAL_DOCUMENT",
    "official_source_excerpt": "An exact continuous quotation of at least 60 characters visible in the specific official legal text.",
    "act_number_and_date": "Act number and signature/publication date",
    "effective_date": "YYYY-MM-DD",
    "source_checked_at": "2026-10-27T12:00:00+00:00",
    "legal_reason_and_scope": "Explain why this rule applies to this procedure and jurisdiction.",
    "amendment_history_checked": true,
    "transitional_rules_checked": true
  }]
}
```

The example above **is not a verified source**. Never fill it with invented quotes or synthetic confirmation. The actual manifest must come from current official material, with the correct source URL, operative provision, amendment history and jurisdiction.

The CI tool `scripts/validate_official_legal_changes.py` checks exact text changes, allowed official hosts, visible source excerpts, source-date freshness, effective dates and a one-to-one evidence record for every legal edit. Failed or inaccessible sources are never interpreted as proof of repeal. The test does **not** prove legal reasoning merely because a quote exists: an autonomous independent legal audit must also verify applicability, transitional provisions and contradictory official sources; if inconclusive the change remains unpublished.

Changes in production CMS, routes, fees, generated legal documents or court judgments are **not automatically certified by this JSON gate**. Their own content-specific review, evidence and publication constraints remain mandatory. Court decision metadata cannot be promoted to judicial proof. Never fabricate `reviewed_by` or an approval timestamp.

After verified evidence, required GitHub CI, safe merge and Coolify deployment, verify the published page and document again. If any verification cannot be completed, retain a candidate/Issue and do not publish.
