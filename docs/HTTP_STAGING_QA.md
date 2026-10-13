# HTTP staging smoke tests

On every PR/push to the migration branch, GitHub Actions now builds Next.js and
starts an actual staging-process HTTP server with safe defaults:
`SITE_CUTOVER=false`, `CMS_PUBLIC_READS=false`, `COURT_DB_READS=false`.

`scripts/smoke-next-staging.mjs` requests the 33 Webflow source paths from
`migration/webflow-seo-manifest.json` and validates:
- 200 responses and HTML heading/title/canonical for each migrated page;
- `noindex` on all staging pages;
- `robots.txt` denying crawlers and an empty sitemap;
- 404 for unknown paths and a healthy server.

This is a **functional HTTP smoke test**, not pixel-by-pixel comparison,
accessibility validation or verified accuracy of the source legal content.
Live DNS, credentials, real CMS publication, Webflow scripts, redirects,
media licensing and device-browser behavior still require release QA.
