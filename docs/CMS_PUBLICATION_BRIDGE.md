# Stage 5B — reviewed Payload publications to the website

The CMS remains a private, standalone Payload deployment. Its staff auth,
versions, draft/review/approve/publish permissions are not shared with the
public site. **Importing Webflow snapshots does not publish them.**

When an entry has been checked and approved by a reviewer, and a publisher
publishes the approved version in Payload, an **explicit, manual CLI**
may promote those entries into the website staging DB:

1. Prepare a **separate, non-production** site database with migrations
   `0001`, `0002`, and `0003`, plus separate CMS_DATABASE_URL.
2. Run `pnpm --filter @dgi/cms promote:web:dry-run` with CMS_DATABASE_URL
   and a strong PAYLOAD_SECRET. This only reads approved Payload entries.
3. For a consciously authorised staging promotion set
   `CMS_PROMOTE_CONFIRM=yes`, `CMS_PROMOTE_TARGET_STAGING=yes`,
   `SITE_DATABASE_URL=<staging-website-db>` and run
   `pnpm --filter @dgi/cms promote:web:apply`.
4. The promotion uses an atomic SQL transaction. It refuses to replace
   pre-existing publications not owned by Payload. A SQL trigger revokes
   approval during content changes; a second update approves the
   unchanged staged document inside that transaction.
5. Enable `CMS_PUBLIC_READS=true` on **staging only** for QA.
   The public site renders only approved publications, including the
   reviewed homepage, and adds approved slugs to sitemap **only after**
   `SITE_CUTOVER=true`. Do not change that flag until SEO/legal QA.

The promotion is **not an endpoint, background task, or production deployment**.
No unverified judicial outcome is published. It deliberately does not migrate
court decision texts or users. Manual auditing, media rights and verified
URLs remain requirements before any live cutover.
