# DGI — staged release of source-verified correspondence and social tenancy scenarios

Preparation date: 13 November 2026. Branch: automation/dgi-verified-correspondence-release-2026-11-13. PR #74. No protected branch changes or deploy.

## Source-verified public scenarios

1. `dgi-no-response` — ordinary written correspondence under Federal Law 59-FZ (Art.12). Do not apply to special public services. Page `/situatsii/dgi-no-response`. Sources: Ministry of Labour `https://mintrud.gov.ru/docs/laws/108`, FNS `https://www.nalog.gov.ru/rn77/apply_fts/obr/`, prosecutor `https://epp.genproc.gov.ru/ru/dvtp/activity/legal-education/explain/e75300/`.
2. `social-tenancy-dispute` — equality of rights and duties of qualifying tenant family members under Art.69 Housing Code, with Art.70 admission exception and no assumption that registration alone grants status. Page `/situatsii/social-tenancy-dispute`. Sources: Supreme Court Plenum 14 `https://www.vsrf.ru/documents/all/8112`, prosecutor `https://epp.genproc.gov.ru/ru/proc_12/activity/legal-education/explain/e151947/`, consolidated Housing Code dated May 2 2026, hosted by Moscow `https://www.mos.ru/upload/documents/files/6377/Kodeksot29_12_2004N188-FZJilishniikodeksRossiiskoiFederacii%28sizmeneniyamina2maya2026_Tekst.pdf`.

32 literal fields including metadata, question prompts/options, conditional rules, scope/exceptions, and document-generator copy have separately bound claim evidence in `legal-evidence/three-source-claims.json`, subject to live fetch, quote match and same official-source authority checks.

## Publication boundaries

- These two scenarios are generated through one SHA-pinned `/situatsii/[scenarioId]` page and a SHA-pinned `VerifiedScenarioIntake.tsx` client component.
- No other research-only scenario is present in the public JSON. `navigator-dgi` still has production 404 and non-indexable preview metadata.
- The draft generator fills only neutral placeholders and exactly verified clause strings. There is no judicial remedy choice, money amount estimate, filing deadline, guaranteed court outcome, personal-data upload, external submission, account storage or remote AI inference.
- A general 59-FZ answer cannot be generated when the user indicates a public-service application. An Article69 observation cannot generate a request when there is no documented basis for assessing family status.
- The social tenancy form is an information request, not a court claim, determination of status or guarantee of disclosure of protected personal information.
- The official Moscow Housing Code PDF is an official-hosted consolidation as of May 2, 2026. The legal provision is crosschecked with Supreme Court and prosecutor; no other parts of the historical PDF are auto-approved.

## Automatic legal checks

`scripts/verify_dgi_scenario_evidence.py` rejects incomplete field evidence, stale or duplicate publishers, changed procedure scope, changed questions or document clauses. The generic three-source gate pins the exact TSX/SEO/React code. It also prevents unknown pages or unreviewed runtime components.

The official excerpt validator now supports PDF using **bounded** offline Poppler `pdftotext` processing from already retrieved trusted HTTPS official-host bytes, checks the `%PDF-` header, caps input to 18 MB, and rejects unextractable/scanned PDFs, excessive input and redirected hosts. CI installs Poppler locally and tests seven adversarial cases.

## Release chain / no auto-deploy permission

1. PR #71: existing neutral-directory source policy.
2. PR #72: public topic directory + private research-only questionnaires.
3. PR #73: structured five-scenario source gate and conditional document planner.
4. PR #74: first two individually sourced public scenarios, legal evidence, SEO and safe request generation.

Before any merge into protected `infra/coolify-russian-vps`, rebase/retarget stacked PRs and require current exact-SHA successful build, Node, database, CMS, Chromium, Firefox/WebKit, Lighthouse, official HTML+PDF evidence and protected-branch immutable policy. Verify correct local live-mode site flags, canonical and sitemap entries and that `/navigator-dgi` remains 404 in production. Confirm all original legal pages and forms still work. Authorization to deploy is separate; never merge protected branch on the strength of a staged PR alone.

Remaining research-only candidates: refusal in privatization, removal from housing register, disagreement with proposed renovation apartment. These require their own current, scope-equivalent third-source reconciliation, full field evidence and tests before they can appear in `dgi-verified-scenarios.json`.
