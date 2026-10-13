# Webflow → Next.js SEO inventory (2026-10-13)

Source: user-connected Webflow site `6aca6bde03aad0f2e3c19259`
(`dgimos.design.webflow.com` in Designer; published URL `dgimos.webflow.io`).

`migration/webflow-seo-manifest.json` contains the non-secret **published**
static page manifest retrieved from Webflow Data API, including 33 URL paths,
SEO title and description, Webflow page IDs, and timestamps.

`scripts/tests/webflow-seo-parity.test.mjs` asserts that all 33 migrated
Next.js snapshots preserve slugs, source URLs and the corresponding titles
and descriptions. The four CMS collection template routes are tracked
separately; do not treat them as published, reviewed judicial decisions.

This checks **metadata parity only**, not content accuracy or pixel-perfect
rendering, Webflow CSS backgrounds, form functionality or licenses. There were
zero entries returned from the Webflow Assets API on the inspection date.
That does not exclude inline external images or CSS background URLs.

Release checklist for manual/staging QA:
1. Compare desktop and mobile pages at the same 33 URLs, including links,
   forms, headings, anchor targets, menu behavior and 404 handling.
2. Verify canonical, indexation rules, robots, sitemap, OG tags and schema,
   using Search Console and Yandex Webmaster after approval.
3. Only after editorial/legal review resolve any expired regulations or official
   contacts; do not auto-publish guessed updates.
4. Create explicit 301 redirects for any changed URLs; keep unchanged paths.
5. Preserve `SITE_CUTOVER=false` until a responsible person approves release.
