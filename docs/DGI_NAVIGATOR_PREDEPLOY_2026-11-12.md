# DGI housing navigator — predeploy release note (12 November 2026)

**Target branch:** `infra/coolify-russian-vps`.
**Release status:** candidate only, unmerged. No Coolify action authorized in this task.

## Public changes to ship

New neutral URL: `/temy-zhilishchnogo-prava`.

- Seven static thematic groups linking exclusively to the 23 known previously owner-released legacy pages.
- Nine other already released topic/reference destinations.
- Ten links to existing form components on their current article pages; *not* automatic document selection.
- Navigation into the new directory from the homepage and footer.
- SEO title/description, conditional canonical and indexability only under the preexisting `siteIsLive` release gate; new sitemap entry only in `siteIsLive` state.
- No new rule of law, procedural deadline, claim of official acceptance, document recommendation or outcome conclusion.

The catalogue repeats source metadata and factual labels from previously published
materials. It does **not** imply fresh verification of those old articles. Claims
that could change legal outcomes remain outside this release.

## Private-only changes (must remain inaccessible publicly)

`/navigator-dgi` still returns 404 under `siteIsLive` and is noindex elsewhere,
not in sitemap or public navigation. Research section contains:

1. Refusal of privatization: five fact questions.
2. Removal from housing register: four fact questions.
3. Missing response from DGI: four fact questions.
4. Social-tenancy dispute: four fact questions.
5. Renovation offered-unit disagreement: four fact questions.

Answers are constrained to radio options and ephemeral React state. They are not
persisted, transmitted, exported or automatically used for legal decisions.

Three earlier links-only research scenario bundles remain separate; the addition of
fact intake does NOT authorize publication or determine remedies.

## Legal evidence / zero-approval rule

`legal-evidence/three-source-claims.json` remains unchanged and contains zero
approved new legal claims. Existing source-candidate records are not approval.

- **Privatization refusal:** Supreme Court Plenum No. 8, Moscow municipal guidance
  and prosecutor commentary do not yet corroborate the *same procedural conclusion*.
  Especially, a general right to judicial protection does not verify the kind of case.
- **Housing register removal:** city statute versions, legal applicability and
  official case full texts still need reconciliation.
- **Missing answer to DGI:** Federal Law No. 59-FZ general correspondence can differ
  from special government-service complaints; no blanket deadline is published.
- **Social tenancy and renovation:** no claim-level three-authority reconciliation.
- **Judicial practice:** do not infer an individual result from an abstract, excerpt
  or case headline; no automatic matching of the current 44 case records to disputes.

Draft evidence references for the correspondence topic (for research, not publication):
- FNS: https://www.nalog.gov.ru/rn77/apply_fts/obr/
- General Prosecutor's Office (Tula, dated 2026-03-13):
  https://epp.genproc.gov.ru/ru/proc_71/activity/legal-education/explain/e8421318/
- Moscow municipal medical-organisation reception regulation:
  https://gp8.mos.ru/reglament_priema_grazhdan

The sources describe a *general* 30-day correspondence rule, but the Moscow
reference covers a narrower organisational setting, does not establish a
DGI service-specific route, and does not validate exceptions for all case types.
Consequently, these are research sources only and do not lift the legal gate.

## Release gate — complete before merging this PR

- [ ] Node tests, TypeScript, Next.js build at final exact SHA green
- [ ] Chromium + Firefox + WebKit browser QA green at exact SHA
- [ ] Lighthouse lab green at exact SHA (lab numbers are not field CWV)
- [ ] Mandatory three-independent-official-sources *publication gate* green
- [ ] Existing owner-release allowlist unchanged (33 legacy records)
- [ ] Check in CI that public directory is in sitemap only on approved live release
- [ ] Confirm `/navigator-dgi` remains 404 under approved production flags
- [ ] Confirm none of five questionnaires, raw claim candidates or new judicial
      interpretations are publicly served
- [ ] Review diff for unintentional change to prior legal texts or site flags
- [ ] **Explicit owner consent before merge if Coolify auto-deploys from the
      protected integration branch**. No merge, redeploy or publish performed
      by this change alone.

## Post-deploy verification (not yet run)

After approval and deploy, inspect exact released commit:
- `/temy-zhilishchnogo-prava`: 200, correct links and meta canonical
- `/navigator-dgi`: 404, no sitemap entry
- `/sitemap.xml`: approved directory present exactly once
- Home/footer links work, no mobile horizontal overflow
- Existing ten builder destinations still load
- Existing 33 owner-released articles, court catalog, news and robots remain reachable
- Re-check Google/Yandex indexing setup separately; availability and sitemap do
  not guarantee indexing.
- Record deployment ID, released SHA, smoke-check evidence and rollback candidate.

## Rollback

If smoke checks fail, use the application's previously verified deployment in
Coolify and avoid changing the legal approval manifests to conceal a failure.
No rollback action has been executed.
