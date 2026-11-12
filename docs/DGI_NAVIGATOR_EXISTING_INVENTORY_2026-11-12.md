# DGI — complete existing-page navigator inventory (12 November 2026)

## Scope

Continuation of protected-branch PRs #61 and #64. Only the **private, noindex** preview
at `/navigator-dgi` is changed; production keeps returning 404 from
`if (siteIsLive) notFound()`. There is **no new legal claim, court-outcome inference,
document recommendation, sitemap entry, or Coolify deployment**.

## Existing 33-page inventory (from pages-0..5.json and owner allowlist)

- Main thematic groups (7): **23 distinct previously released internal URLs**.
- Cross-topic reference directory: **9 distinct previously released internal URLs**.
- Root homepage (empty slug): **1**.
- Total: **33** legacy records and **32** distinct internal articles.

The originally implemented thematic links are preserved. Added:
- Housing records: `zhilishchnye-subsidii`.
- City property: `vymorochnoe-imushchestvo-moskva`,
  `vymorochnoe-imushchestvo-kvartira-moskva`, `kadastrovaya-stoimost`.
- Cross-topic directory: `rukovodstvo-dgi-moskvy`,
  `rasporyazheniya-prikazy-dgi-moskvy`, `zapis-na-priem-dgi-moskvy`,
  `novosti-zhilishchnogo-prava`, `sudebnaya-praktika-dgi`,
  `kontakty-dgi`, `gosuslugi-dgi`, `normativnye-akty`, `funkcii-dgi`.

These are **editorial navigation labels**, not a substantive evaluation of the
accuracy or applicability of any of the legacy articles. The cross-topic
section is not an eighth housing-law cluster.

## Existing ten document generators

The navigator adds **links**, not a parallel generator or automated routing logic.
Each label is copied from the existing React builder configuration and each
destination is checked against the matching `MigratedArticle` render path.

| Existing builder kind | Existing page |
| --- | --- |
| `request` | `zayavlenie-v-dgi-moskvy` |
| `service-complaint` | `zhaloba-na-dgi-moskvy` |
| `civil-objection` | `isk-o-vyselenii-socialnyy-naem` |
| `housing-removal` | `snyatie-s-zhilishchnogo-ucheta-moskva` |
| `privatization-service-complaint` | `otkaz-v-privatizacii-kvartiry` |
| `utility-quality` | `pereraschet-zhku-moskva` |
| `inheritance-acceptance` | `vymorochnoe-imushchestvo-moskva` |
| `emergency-housing` | `avariynoe-zhile-moskva` |
| `renovation-comments` | `renovaciya-pereselenie` |
| `mkd-information` | `zashchita-prav-sobstvennika-mkd` |

The forms already exist in the source. Listing a form **does not certify**
legal suitability or the current validity of the legal statements inside its
older implementation. No form or legal text was changed.

## Court catalog and claim verification

The navigator already exposes a neutral link to the owner-released
`/sudebnaya-praktika-dgi` catalog. It deliberately does **not** claim that
the repository's 44 existing court records have been individually verified for
a specific user scenario. Case-to-topic and case-to-document recommendations
remain blocked until record-level official full text and claim-scoped
three-independent-authority verification are complete.

The three prior research-only situations remain unpublished. The
`legal-evidence/three-source-claims.json` empty-approval state and strict
CI gate remain unchanged. A candidate source URL is not an approval.

## Acceptance tests and release boundary

- Test all 33 approved legacy entries are covered exactly once (32 internal
  destinations + root homepage) without fabricated slugs.
- Test all ten form links are to the pages that actually render their
  respective builder kind and match existing labels.
- Test seven primary groups, the three research-only scenarios and existing
  `noindex`, production 404, and sitemap exclusion.
- Test responsive navigation and keyboard focus from 320 to 1920 px.
- Review CI results for exact PR head before merge.
- **Do not deploy from this task.** Any release remains owner-controlled and
  requires a separate live-domain and post-deployment verification.

## Remaining after this technical package

1. Claim-by-claim official current-law verification (3 independent authorities,
   exact excerpts, same scope and time, conflict analysis).
2. Verified court-case tagging before case-specific recommendations.
3. Evidence-backed procedural decision steps for the five original scenarios.
4. Legal tests and release approval for any new public interactive guidance.
