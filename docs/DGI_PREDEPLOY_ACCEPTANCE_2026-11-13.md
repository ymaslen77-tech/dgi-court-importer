# DGI staged release — predeploy acceptance
Date: 13 November 2026. **NO production merge/deploy executed.**

## Existing staged chain

- PR #71: immutable navigation-only TSX policy, with adversarial checks; base infra/coolify-russian-vps.
- PR #72: 7 public housing topic groups, 32 existing internal article links, 10 existing form entrypoints; base PR #71.
- PR #73: 5 private fact-questionnaires, structured legal scenario/generator evidence gate and two live official-source consensus probes; base PR #72.

## Source checks (automated, no routine human permission)

1. 59-FZ Art 12: 30 days from **registration** for ordinary written correspondence within competence, with special-service and judicial exclusions. Source quorum: FNS (nalog.gov.ru), Prosecutor (genproc.gov.ru), Moscow government portal (mos.ru). Same-authority fallback is allowed only if the complete alternative excerpt itself passes the same atomic checks and is verifiably present. Logs name the observed publisher and chosen exact URL.
2. Housing Code Art 69 part 2: equal rights and obligations of legally qualified family members of a social-housing tenant. Source quorum: Supreme Court Plenum #14 (vsrf.ru), prosecutor clarification (genproc.gov.ru), official Moscow-hosted updated Housing Code PDF (mos.ru). Rights depend on legally established family membership and lawful occupancy; a registration entry alone is not a positive qualification.
3. Remaining privatization, registry-removal and renovation legal claims have typed research records and candidate official URLs but have **not** completed exact three-independent-source confirmation. They must not be published as individualized legal advice.

All source probes are re-fetched inside GitHub Actions. Source outages **quarantine only the affected claim** and create an explicit research_only result. Quote mismatch, incorrect law or same-publisher duplication is a hard failure. Python PDF checking reads only bounded official PDF text layers and rejects OCR guesswork or unsafe redirects.

## Scope of current deployable public feature

The public change is a **navigation directory to owner-released material and existing working forms**. No new public scenario recommendations, court outcome claims or automatic legal remedy choices are part of this release. Research `/navigator-dgi` and all five case intakes remain production 404/noindex, not in sitemap.

Live-source validation of two narrow legal facts is evidence for future scenario copy, not blanket authorization of all scenario titles, conditions or document clauses. Public legal scenario JSON stays empty until each field/generator clause is sourced.

## Required exact-SHA gates before approving Coolify

- `DGI staged full release preflight — no deploy`: whole three-PR diff against original `infra/coolify-russian-vps`, including protected TSX/SEO source hash and page boundary.
- `DGI official-source consensus — narrow 59-FZ claim` (3 independent observed sources or research-only outage).
- `DGI three-source social-tenancy consensus (official PDF)` (3 independently observed sources or research-only outage).
- `DGI scenario claims and document clauses — fail closed` (structured schema, 25+ adversarial tests).
- `Next.js migration checks` and `Browser QA — current DGI release gates` (including mobile, forms, links and production 404).
- Protected policy PR #71 test suites and browser/SEO release checks from catalog PR #72.

## Actual deploy boundary

The repository's protected Coolify integration branch is unchanged. The three PRs remain stacked so **each protected merge may automatically trigger Coolify**. Do not merge any PR without owner approval for deployment. Ideally coordinate temporary pause of Coolify auto deploy, review/merge #71 then rebase #72/#73 onto protected policy, run exact-SHA protected gates, merge the integrated release and enable one production deployment. If pausing auto deploy is not supported, notify owner of the possibility of multiple deploys and do not claim this is a one-click release.

Post-deploy: verify `/temy-zhilishchnogo-prava` returns 200 with canonical and sitemap, `/navigator-dgi` returns 404, all 32 old article destinations and 10 forms work, no new unverifiable legal rule is indexed, mobile overflow 0, external sources reachable, 404 fallback and rollback ready.
