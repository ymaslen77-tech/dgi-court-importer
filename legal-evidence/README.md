# DGI legal content: mandatory three independent official sources

**Effective for all newly proposed factual/legal copy from 10 November 2026.**
The repository must never invent laws, dates, procedural deadlines, legal
outcomes, professional reviewers or source text. Three different URLs,
three mirrors or three excerpts from one publishing authority count as **one**
source. Fewer than **three independent official publishers** means the claim
does **not** receive publication approval.

## Verification is claim-specific, not article-specific

For each new/changed statement, record its **exact proposed text**, its content
file / record / field and **three distinct official source records**:

- Exact specific HTTPS document URL of each independent publisher, not homepage
  or a search-result excerpt.
- Verbatim excerpt observable in that source and the date/time it was checked.
- Explicit comparison that all three independently support **the same fact,
  legal proposition, affected persons, jurisdiction and period**.
- Assessment of amendments, entry into force, transitional rules, later judicial
  acts and material contradictions, when applicable.
- Reasoned scope analysis. If the comparison is inconclusive, hold the specific
  claim in research/draft, never silently substitute an unrelated source.

Automated HTTP tests can prove three official excerpts are present and current
and that publishers are independent. They **cannot prove semantic equivalence,
legal applicability or a correct legal conclusion by themselves**. A real
substantive comparison remains mandatory. No fictional `reviewed_by` fields,
signatures or approvals are permitted.

## Manifests and validators

1. Existing legal paragraphs changed in `apps/web/src/data/pages-0.json`
   through `pages-5.json`: `legal-evidence/changes.json` must include the exact
   original/replacement text, act identity and effective date, reasoning,
   amendment/transitional checks, `source_agreement_checked`,
   `contradictions_checked`, `source_comparison_notes` and `sources` — an
   array of at least three objects containing
   `official_source_url`, `official_source_excerpt`, `source_checked_at`.
   `scripts/validate_official_legal_changes.py` checks them, live.
2. New/edited news, public court metadata, guides, source catalogs and new
   owner-released page records: `legal-evidence/three-source-claims.json`.
   It has `version:1` and `claims:[]` until a **real, observed** claim is ready.
   Each claim uses `file`, `record_id`, `field`, `exact_text`,
   `same_legal_conclusion_checked`, `same_period_and_scope_checked`,
   `contradictions_checked`, `unresolved_contradictions`,
   `source_comparison_notes`, and the three `sources` records described
   above. `scripts/validate_three_source_publication.py` fails if even one
   new factual field lacks exact evidence.
3. New public routes require a separate source-checked publication plan.
   Private prototypes must explicitly return 404 in production, set robots
   noindex/nofollow and remain out of sitemap and production navigation.
4. New court PDF copies still require the original full official judicial
   text, case identity, SHA-256 and sensitive-data screening **in addition**
   to three independent official confirmations of new editorial claims.
   If any proof is missing, the item stays in the research queue.
5. CMS records, generated legal documents and new legal navigational rules
   must meet the same substantive standard before separate release. Existing
   database permissions and publication flags must not be bypassed.

Unit-test fixtures intentionally use placeholder documents. They do **not**
establish a real legal fact or qualify as evidence. Do not copy fixtures into
production manifests.

## Existing content

Previously owner-approved 33 migrated pages, 26 news items and 44 official
court-act records **remain available under their prior controls**; they are not
automatically labelled 'verified by three sources'. Review them progressively,
especially whenever their legal rules are amended. Do not globally deindex the
existing public site merely because unrelated new drafts lack three sources.

## Release sequence

Research source documents → compare claims independently → create evidence
manifest → protected PR → mandatory CI including three-source gate → merge only
if evidence/reasoning/CI are sound → owner-controlled Coolify deployment →
recheck live HTTP, privacy, sitemap and individual legal conclusions.

A primary act is not interchangeable with an unrelated law. For example,
a law about privatizing government assets must **not** be substituted for the
rules on privatization of housing simply because both include the word
"privatization". If the third confirming authority cannot be established,
the legal route stays private.
