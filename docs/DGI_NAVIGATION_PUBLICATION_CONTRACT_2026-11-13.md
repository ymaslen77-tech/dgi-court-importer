# DGI: fail-closed navigation-only TSX publication contract
Date: 13 November 2026. Issue: #70.

## Scope and legal boundary

The existing site gate refuses ANY new/modified public Next.js page, even an
index of links previously released by the owner. This change adds a **single
content-addressed navigation contract**. It is deliberately **not** a general
exception for TSX or an assertion that three legally equivalent sources have
been verified.

Only exactly four reviewed source files (new public directory page, existing
homepage, existing sitemap and existing site shell) are admitted at their
**pinned Git blob SHA-1**. The whole original source is covered, including JSX
text, static metadata, dynamic expressions, imports, SSR branches, link targets,
robots rules, and hidden legal copy. Any byte change is rejected. Source-derived
titles/forms are separately bound to unchanged hashes of the entire
`navigator-preview.ts` data module, the 33-page original owner allowlist,
and the six original migrated page JSON snapshots.

This contract is narrowly targeted at `/temy-zhilishchnogo-prava`. The directory
only links to existing owner-published pages, with their existing titles and
form labels. It does not publish the separate private research scenarios,
unverified legal claims, court-result inference, procedural recommendations
or document-selection rules.

The existing `legal-evidence/three-source-claims.json` claim-level gate remains
unchanged. **All newly authored legal assertions in other TSX files remain
quarantined**, including unsupported texts placed in metadata, imported
helpers, route handlers, client components or alternate conditional branches.

We also add the six legacy `pages-*.json` snapshots to normal claim-level
content auditing. This closes a source-provenance loophole where imported page
titles could otherwise change without claim evidence.

## Security and future editing

- This is a **fixed audited snapshot**, not a magic regex that treats prose as
  nonlegal. New strings require a new contract review or three-source
  field-level legal evidence as appropriate.
- The SHA-1 is Git's exact blob object digest for the full file, not a hash of
  manually extracted rendered text. Git object-format verification is tested.
- Changing the approval hashes is itself a protected-policy change, subject
  to independent human code review. **Do not blindly update hashes** to make
  a failing public content change pass.
- The protected-branch content approval action intentionally executes the
  existing protected version of the policy. New policy code does not
  authorize itself inside the same PR.
- The same rule runs in the three-source workflow and, after separately
  reviewed merge of the policy, in the protected-version approval workflow.
- The private `/navigator-dgi` route retains its existing `siteIsLive`
  production 404, nonindexability and sitemap exclusion.

## Adversarial tests

Synthetic tests assert fail-closed behavior for new legal copy, altered SEO
metadata, dynamic labels, hidden production branches, changed links, changes
to the homepage, unknown public routes, new runtime legal components,
mutation of source title data, mutation of owner-release slugs and missing
source files. Existing tests already cover two/duplicated/obsolete official
sources, incomplete manifests and conflicts.

## Two-stage release (no automatic deploy)

1. Policy PR: code+tests+docs only. It must pass protected CI and **human
   review** before an authorized merge to the protected deployment branch.
2. Public directory PR: only after policy adoption, its exact pinned source
   files, source-bound data and all legal, browser, SEO and build checks must
   pass on the protected branch. Deploy/merge still requires separate owner
   approval because Coolify may auto-deploy from that branch.

**No change to any legal-evidence approval manifest. No claimed expert signoff.**
