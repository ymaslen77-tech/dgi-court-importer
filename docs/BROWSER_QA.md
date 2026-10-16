# Browser E2E acceptance — Next.js staging

Automated Playwright Chromium projects exercise 1280px desktop and 390px
mobile viewports, all 33 original static routes and 22 archived case URLs.
They check HTTP status, noindex, canonical, heading hierarchy, horizontal
overflow, keyboard skip link and that unreviewed CMS URLs return 404.

Run on a clean Node.js 22 machine:
`pnpm install --no-frozen-lockfile`
`pnpm --filter @dgi/web build`
`pnpm --filter @dgi/web exec playwright install chromium`
`pnpm --filter @dgi/web test:e2e`

GitHub Actions: `.github/workflows/browser-staging-qa.yml`.
No production credentials, CMS public reads or production indexation are
required. CI captures screenshots and traces on failure.

These tests cannot prove pixel-accurate Webflow parity, external image
rights, legal correctness, CMS database integrity, or a deployed permanent
staging environment. A signed manual visual/accessibility acceptance is
still necessary before production cutover.
