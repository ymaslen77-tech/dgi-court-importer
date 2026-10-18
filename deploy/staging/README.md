# Independent private staging — NOT a public deployment

This stack is a reproducible staging configuration, **not evidence that a server
is running**. Provision a private Linux host with Docker Engine + Compose v2,
adequate CPU/RAM/storage, private firewall, HTTPS reverse proxy and a separate
encrypted, access-controlled off-host backup destination. The Webflow GitHub App
is **not required** for this independently hosted stack.

## Isolation and safe boot

1. On the private host, check out `feature/nextjs-webflow-migration`. Copy
   `deploy/staging/.env.example` to `deploy/staging/.env`, replace **all**
   sample secrets with long independently generated secrets. Encode URL-reserved
   password characters in DATABASE_URL and CMS_DATABASE_URL. Restrict file to
   mode 0600. Never place secrets into Git, Actions logs or chat.
2. DATABASE_URL must target **site-db:5432/housing**, CMS_DATABASE_URL must
   target **cms-db:5432/housing_cms**, with distinct credentials. Do not use
   production or Webflow databases. Leave all publishing flags off.
3. From repository root, export the private env file into the current shell
   securely, then run `pnpm staging:preflight`. It checks configuration
   but **not** networking, backup integrity or database contents.
4. Validate Compose before launch:
   `docker compose --env-file deploy/staging/.env -f deploy/staging/compose.yml config --quiet`.
5. Start isolated databases first:
   `docker compose --env-file deploy/staging/.env -f deploy/staging/compose.yml up -d site-db cms-db`.
   For a **new empty website DB only** run
   `STAGING_INIT_CONFIRM=empty-site-db bash deploy/staging/init-site-schema.sh`.
   The CMS schema is managed by Payload on CMS startup, not by the site SQL.
6. Run `docker compose --env-file deploy/staging/.env -f deploy/staging/compose.yml up -d --build web cms`.
   The preview ports bind only to 127.0.0.1:3100/3101, never 0.0.0.0.
   For remote QA use authenticated HTTPS proxy or SSH tunneling; keep CMS
   behind private access controls. Confirm both health checks, authenticated
   CMS login, role isolation and robots noindex.
7. On this same private host run the **existing** Webflow export, archive
   validation and Payload imports following
   `docs/WEBFLOW_PRIVATE_CONTENT_IMPORT.md`. Never upload raw exports
   to the public repository. All 50 entries remain *unapproved*.
8. Configure encrypted scheduled backups. Export `AGE_RECIPIENT` on the
   private host, then run `bash deploy/staging/backup.sh`.
   Provide `AGE_IDENTITY_FILE` and the two resulting archive paths to
   `bash deploy/staging/restore-check.sh <site.age> <cms.age>`.
   A job scheduler, off-host replication, retention, monitoring and an
   actual witnessed restore are required before signoff.
9. Run `node scripts/smoke-next-staging.mjs` against the loopback web port
   (set its BASE_URL as documented) and the Playwright desktop/mobile QA.
   Compare all 33 screenshots with Webflow and manually review legal source
   links and media rights. Record signoff outside the public repository.

### Deliberate stop conditions

- The container image compiles Next/Payload on first start **after**
  PostgreSQL becomes healthy; allow for initialization but investigate failed
  builds. This simplifies staging while avoiding a DB dependency at image
  build time. For production use separately built, pinned release artifacts.
- No server, backups, restore, TLS or external domain are created by committing
  this Compose file. Do not claim these acceptance gates passed without logs.
- No public database ports, no automatic publication, no domain cutover and
  no merge of PR #2. Production launch requires independently reviewed
  editorial, visual, SEO, security and rollback approvals.
