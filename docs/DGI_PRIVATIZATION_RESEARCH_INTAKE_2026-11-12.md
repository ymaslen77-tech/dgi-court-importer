# DGI — refusal of housing privatization: research-only fact intake

Date of research: 12 November 2026. Implementation branch: `automation/dgi-privatization-intake-research-2026-11-12`.
This file is **internal research and QA**, not a public legal article or legal advice.

## Implemented prototype

On the already closed `/navigator-dgi` route, a client-only questionnaire records
five factual dimensions: request submitted, nature of response, known housing
document, information about other participants, and whether the written refusal
contains a stated reason. It accepts radio selections only, not free text,
identifiers, uploads, personal dates or case numbers. React state is resettable
and not exported, persisted or transmitted.

The output is only a restatement of selected answers. There is **no rule-based
classification, legal merits assessment, claim of eligibility, timeframe,
procedural selection or recommendation to file a specific document**.
The production guard `if (siteIsLive) notFound()` and noindex/no-sitemap
conditions inherited from PR #67 remain in effect.

## Official authority research queue (NOT a publication approval)

| Authority | Official primary URL | Narrow topic reviewed | Current approval state |
| --- | --- | --- | --- |
| Supreme Court of the Russian Federation | https://www.vsrf.ru/documents/all/7727 | Plenum 24.08.1993 No. 8, paragraphs 1–3: judicial consideration and the description of disputes after refusal | Candidate observed; still requires current-law cross-check, three independent sources confirming the *same scoped procedural claim* |
| Moscow city government | https://www.mos.ru/upload/documents/files/3258/Instrykciya49%285%29.pdf | Administrative information concerning privatization | Legacy PDF candidate; current version and specific procedural equivalence NOT verified |
| Prosecutor General's Office | https://epp.genproc.gov.ru/ru/proc_59/activity/legal-education/explain/e8519517/ | Official education on judicial protection in privatization disputes | The right to apply to a court does NOT independently prove the exact form of proceedings |

**Important scope mismatch:** the Supreme Court source addresses a specific
civil-rights dispute and may indicate action proceedings. The Moscow guidance
and prosecutor summary do not yet independently establish the same procedural
conclusion for the exact contemplated facts. Merely counting three domains
would breach the owner's three-independent-authorities rule.

## Before any public decision logic

1. Confirm the currently effective text of the Russian Housing Privatization
   Law No. 1541-1 and applicable Moscow service regulation on authoritative
   sources, including amendments and legal scope.
2. Split proposed legal text into atomic claims. For EACH claim obtain three
   independent official publishing authorities that support the same meaning,
   the same conditions and the same relevant time.
3. Record precise passages, provision/paragraph, checked date, document
   revision/effective dates and mismatches, then run publication-gate tests.
4. Only then attach facts to conditional legal routes, with explicit ambiguous
   outcomes and human/legal review where a recommendation is not validated.
5. Independently verify specific official court decision full texts before
   linking any decision as outcome-based precedent or precedent-like guidance.

## Release boundary

No change to `legal-evidence/three-source-claims.json`: approved claims remain
empty. This branch must remain a draft/stacked PR and must not be merged or
deployed as a new public legal feature before legal and CI review.
