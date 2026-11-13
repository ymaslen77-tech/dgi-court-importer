# DGI public housing-topic catalog — staged release plan

Date: 13 November 2026.
Issue #70, policy PR #71, private navigator PR #67.

## Changes in this staged candidate

New source-neutral route `/temy-zhilishchnogo-prava` shows seven thematic groups
(23 links), nine additional links to previously owner-released pages, and ten
links to previously existing document forms. The catalogue adds no legal
interpretation, deadline or procedural choice.

Homepage and footer link to the directory. Its SEO metadata and sitemap entry
are conditionally enabled only under the existing `siteIsLive` production
release flag. A separate `/navigator-dgi` research page stays 404 under
approved production and remains noindex otherwise.

The private research contains five factual questionnaires (21 questions),
with native HTML radio options only; it does not submit data or provide
legal conclusions.

## Evidence and source identity

The four public TSX/TS files are **exactly** the content-addressed snapshots
pinned by the #70 contract: page, homepage, shell and sitemap. The reused
navigator data module, owner-release allowlist and six migrated page JSON
snapshots must also have exact pinned hashes. Any change to public copy,
metadata, imports, dynamic branches or source titles fails closed; this is
not a text-scanning bypass.

No change to `legal-evidence/three-source-claims.json`.
No new legal claim or derived court result has passed substantive
three-source review. None is made publicly available by this candidate.

## Necessary sequence before deploy

1. Independent human security/legal review of the policy in PR #71.
2. After owner approval, merge policy-only PR #71 to protected branch.
   **This merge may itself trigger Coolify auto-deploy; do not do this
   without deployment approval.**
3. Retarget candidate PR onto the updated protected branch (or merge via a
   separate PR), then require green exact-SHA:
   - Three independent official source publication gate.
   - Protected policy approval gate.
   - Build, typecheck, Node and browser tests Chromium/Firefox/WebKit.
   - Lighthouse laboratory checks.
   - Live-mode 200 for directory and 404 for private research.
   - No unknown URL and no unreviewed legal content.
4. Merge and allow Coolify deploy only after explicit owner authorization.
5. Post-deploy smoke test: catalogue 200 and indexed canonical, private
   `/navigator-dgi` 404 and absent from sitemap, old pages/forms intact,
   no broken links, robots, mobile overflow, redirects and rollback available.

## Explicitly out of scope

General legal TSX procedure-selection logic, automated advice, court-case
outcome inference and unexplained document generation remain blocked until
the per-claim three-independent-authority evidence and manual comparison
are complete. This is a navigational release, not a release of those features.
