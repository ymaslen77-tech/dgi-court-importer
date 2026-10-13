# DGI editorial CMS — separate staging service

Payload CMS + PostgreSQL 17; **not connected to production Webflow** or the
public Next.js data adapter. Deploy separately on a private network and require
staff authentication. No public signup route is allowed by the Users collection.

Roles: `admin` manages accounts and content; `editor` saves drafts only;
`reviewer` approves unchanged drafts; `publisher` publishes previously approved
drafts. Public REST access to editorial entries, court references and media is
denied by design. Approval is revoked whenever substantive content is edited.

Run only after creating a **separate empty CMS PostgreSQL database**.
Use `docker compose -f docker-compose.cms.yml up -d` from the repository root
with `CMS_POSTGRES_PASSWORD` set in `.env`; the original `docker-compose.yml`
remains unchanged:

```
cp apps/cms/.env.example apps/cms/.env
# Set CMS_DATABASE_URL and PAYLOAD_SECRET in the process environment.
pnpm install --no-frozen-lockfile
pnpm --filter @dgi/cms generate:importmap
pnpm --filter @dgi/cms dev
```
Run on port 3001, admin at `/admin`. The CMS database schema is owned by
Payload migrations. Do **not** run housing migrations 0001–0003 against this
database or point the CMS at an existing production database.

Before staff use: provision the first admin once through the **offline**
script while the service is not publicly exposed. Set
`CMS_BOOTSTRAP_CONFIRM=yes`, `CMS_BOOTSTRAP_EMAIL`, and a
`CMS_BOOTSTRAP_PASSWORD` of at least 16 characters, then run
`pnpm --filter @dgi/cms bootstrap:admin`. Remove those environment variables
after successful provisioning. A second bootstrap is refused.
User creation through the HTTP API is admin-only. Keep CMS behind network access controls. Change production credentials and secret.
Media are only stored locally in this staging implementation; use durable
S3-compatible storage and explicit copyright verification before deploying
media publicly. Never import unpublished Webflow text or private CMS exports
into Git. Do not mark an unverified court outcome as a verified judgment.

This is the CMS foundation. Publishing from Payload into `editorial_pages`
is **not yet wired**. That bridge needs explicit audited promotion, source
verification, a separate approval identity and end-to-end tests.

## Reproducible public page import

The 33 previously public Webflow page snapshots can be imported **as drafts**.
First run `pnpm --filter @dgi/cms import:webflow:dry-run` (no DB).
For a one-time local import set `CMS_PRIVATE_IMPORT=yes`,
`CMS_IMPORT_CONFIRM=yes`, the private CMS database URL and a strong
Payload secret, then run `pnpm --filter @dgi/cms import:webflow:apply`.
The importer is idempotent and does not overwrite previously edited
records. It creates **zero approvals and zero publications**. It does
not import unpublished CMS content, legal interpretations or case outcomes.
The home page is staged under slug `home`; map it to `/` only after review.
