# Webflow → Next.js: migration foundation

**Source:** https://dgimos.webflow.io/ (Webflow site `6aca6bde03aad0f2e3c19259`).
**Destination repository:** `ymaslen77-tech/dgi-court-importer`.
**Safety:** Never change the current Webflow DNS or disable the source website during development.

## Phase 1 (this branch)

- Node.js 24.15+, Next.js 16.4+, React 19, TypeScript 6, Tailwind CSS 4.
- The original Python court/news importers and their GitHub workflows remain unchanged.
- `apps/web/src/data/webflow-pages.json`: **32 public slugs** and SEO metadata captured from Webflow on 13 October 2026. The site contains 38 total pages/templates; CMS templates and an archived internal design page are excluded. Homepage is routed separately.
- Three genuinely migrated legal/editorial pages: `/privatizaciya-zhilya`, `/zhaloba-na-dgi-moskvy`, `/kontakty-dgi`. Their text was transcribed from the source Webflow elements, but **must still undergo an editorial and legal-source acceptance check**.
- Homepage is a first responsive code implementation using content from the existing hero/navigation, not a pixel-perfect copy.
- `/sudebnaya-praktika-dgi`: provisional server-side **metadata-only catalog**; the contents of `data/court-catalog.jsonl` are NOT verified judicial decisions. It is always noindex.
- The other 29? slugs are **NOT migrated**: staging displays a noindex migration notice and links to the real source on Webflow. Never turn these into indexable thin SEO pages.
- robots.txt disallows all unless `SITE_INDEXABLE=true` explicitly. Only approved pilot pages can join sitemap; noindex on all incomplete legal routes.
- PostgreSQL migration `db/migrations/0001_initial.sql` establishes editorial, news and court schemas for later Payload integration. **This is not yet a functioning CMS admin**.
- `apps/web/scripts/export-webflow.mjs` exports Webflow page/collection metadata; full CMS items require explicit `--include-items`; exports are **not** Designer HTML/text and are kept in `.private/` outside Git.
- `apps/web/scripts/import-court-candidates.mjs` only imports case metadata, never unverified outcomes or litigant identities. Dry-run by default.

## Local development

1. Copy `.env.example` to `.env` at repository root. Set a strong **local** PostgreSQL password; use the same password in `DATABASE_URL`.
2. `docker compose up -d db`; wait for the database to become healthy.
3. `cd apps/web && npm install && npm run test && npm run typecheck && npm run build`.
4. `npm run dev` to view http://localhost:3000/ (staging only).
5. `node scripts/migrate.mjs` with `DATABASE_URL` available in the process environment. Node scripts do not read root `.env` automatically: start them with a trusted environment loader or export the variables explicitly.
6. To inspect court import: `node scripts/import-court-candidates.mjs`; write only after database migration using `--write`.
7. For a Webflow metadata snapshot: `WEBFLOW_TOKEN=... node scripts/export-webflow.mjs`; full CMS items require `--include-items`. **Never commit exported data before removing any personal information and verifying permissions.**

## Required next stages

1. Obtain a reproducible npm lockfile from a clean installation and replace `npm install` in CI with `npm ci`. Run CI against a patched compatible Next version and review dependencies.
2. Build Payload CMS on an explicitly compatible Next/Payload combination; migrate the standalone SQL tables into Payload collections or agree the separate read-model boundary. Provide editorial roles and audit trail.
3. Export every Webflow page's **real content**, images, canonical, navigation and metadata. API page inventory is NOT a full designer code export. Migrate 32 slugs individually and verify rendering.
4. Migrate news, situation/document CMS and all 37 court CMS records with statuses preserved and deduplicated; do not publish draft/unverified case data.
5. Design case search with FTS/trigram indexes, tests for duplicates/instancing and monitored importer; no uncontrolled crawling.
6. Link check against exact law articles; legality and current editions should be editorially validated before enabling indexing.
7. Mobile, accessibility, Lighthouse, functional, security and URL-redirect parity tests; test staging with `SITE_INDEXABLE=false`.
8. Only after formal acceptance and zero-loss redirects: enable indexable production and separately plan a DNS migration. Never update DNS as part of this PR.

## SEO inventory acceptance rules

- Preserve legacy slug and semantic target from `webflow-pages.json`.
- One H1, title and meta description for every approved page.
- Canonical must reference final production URL **only after cutover**.
- Sitemap excludes court candidates and all migration placeholders.
- Distinguish independent legal reference website from government service.
- Preserve existing links to primary legal sources, but retest target article URLs (previous Webflow links have known issues).
