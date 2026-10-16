# Full Webflow CMS source migration — private staging only

Source: `https://dgimos.design.webflow.com/`, site `6aca6bde03aad0f2e3c19259`.
Webflow includes 37 court cards (22 formerly published, 15 drafts), 4
normative records, 6 legal situations and 3 news posts. None is automatically
verified, approved or made public by this import.

The full original Webflow fields are NOT in Git; the existing 50-record
metadata queue is not a full-content migration. This change adds an independent
admin-only Payload collection `webflow-private-sources` and idempotent importer.
It has not been executed against a durable staging database.

On a secured local/staging environment:
1. Run the existing `scripts/export-webflow.mjs` with a **read-only**
   `WEBFLOW_TOKEN`. It saves raw private snapshots under the gitignored
   `.migration/webflow` directory. Never commit the export or a token.
2. Run `pnpm --filter @dgi/cms import:cms-private:dry-run`, which validates
   pinned IDs, slugs, draft status, field types and all 50 records.
3. Configure an isolated and access-restricted **staging** Payload/PostgreSQL
   instance and backups. Do not point it at production. Set `CMS_DATABASE_URL`,
   a strong `PAYLOAD_SECRET`, and explicit confirmation variables
   `CMS_PRIVATE_IMPORT=yes`, `CMS_IMPORT_CONFIRM=yes`,
   `CMS_FULL_CONTENT_CONFIRM=yes`, `CMS_CONTENT_IMPORT_TARGET=staging`.
4. Run `pnpm --filter @dgi/cms import:cms-private:apply`.
   The importer creates source snapshots only; existing matching snapshots
   are skipped and changed originals produce conflicts before any writes.
5. Inspect the admin-only Payload collection and independently reconcile legal
   texts, court act results, dates, appeal links, sources and privacy.
   Remove confirmation variables afterwards. Raw HTML must be sanitized before
   any publication. Enforce access audits, encryption and data retention.

There is deliberately no public Next.js route or automatic publishing bridge
for this collection. CI only tests validation code using synthetic fixtures.
Complete legal/editorial validation, design parity, SEO, accessibility,
performance and staging acceptance remain separate release blockers.
