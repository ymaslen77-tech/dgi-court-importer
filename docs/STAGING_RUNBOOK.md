# Isolated staging deployment — operational runbook

Status: **not provisioned**. Webflow Cloud standalone staging creation failed
with `GITHUB_APP_NOT_INSTALLED`; the repository owner must authorize the
Webflow GitHub App, or deploy to an independently managed environment.
Do not use Webflow production, switch DNS or merge Draft PR #2.

## Non-production infrastructure requirements

1. Provision a private staging host with Node.js 22, pnpm 10 and Git access;
   use only the feature/nextjs-webflow-migration branch.
2. Provision two *distinct* PostgreSQL 17 databases for CMS and website
   staging, each with a different dedicated credential and isolated data
   volume. Existing docker-compose.cms.yml is for local CMS DB only.
3. Create secrets outside Git: CMS_DATABASE_URL, DATABASE_URL,
   PAYLOAD_SECRET, CMS_POSTGRES_PASSWORD and POSTGRES_PASSWORD. Set
   SITE_CUTOVER=false, SITE_RELEASE_APPROVED=no, CMS_PUBLIC_READS=false,
   COURT_DB_READS=false. Never send real secrets into chat or GitHub.
4. Run `node scripts/staging-preflight.mjs` with those environment variables.
   This checks configuration only; it does not provision databases or
   test TLS, recovery or data retention.
5. Apply db/migrations/0001_initial.sql through 0004_court_search.sql
   to the **website** database only. Configure Payload's migration workflow
   against the **CMS** database only. Never apply the housing SQL schema
   to CMS and never use a production database.
6. Import 33 original page drafts and 50 sanitized CMS records into the
   private Payload instance. To import *full source fields*, separately
   export Webflow CMS with a read-only token to the gitignored
   `.migration/webflow/` directory, then dry-run and apply the
   `import:cms-private` script according to
   docs/WEBFLOW_PRIVATE_CONTENT_IMPORT.md.
7. Verify administrator authentication, access control for source snapshots,
   no public CMS reads, and zero unintended publications.
8. Take a PostgreSQL custom-format backup of each database using
   `pg_dump --format=custom --no-owner --no-privileges --file=...`.
   Encrypt backup storage, restrict access and test restoration into
   a disposable third database with `pg_restore --exit-on-error`.
9. Start Next.js preview with site flags disabled, test /api/health,
   /robots.txt, /sitemap.xml, all 33 routes, 22 archive URLs, search
   API and both successful/unauthorized CMS access. Verify TLS, logging,
   mobile UI, accessibility and response times against acceptance criteria.
10. Manually sign off legal content, images, SEO, backup recovery and QA;
    only then plan a separate cutover with rollback and DNS ownership.

Staging preflight does not verify DB reachability, secret entropy or a
completed backup. No production launch is authorized by these steps.
