# Release readiness — Webflow to Next.js

Source: dgimos.design.webflow.com; Webflow site ID 6aca6bde03aad0f2e3c19259.
Run `pnpm release:audit` to report blockers from sanitized, committed source
inventories. `pnpm release:require-ready` intentionally fails while release
approval has not been established. Passing CI does not constitute approval.

## Manual acceptance requirements

- [ ] Reconcile all 50 private CMS records against their original content.
- [ ] Validate court results, official acts and links between instances.
- [ ] Check current versions and applicability of the 4 legal documents.
- [ ] Verify dates and legal status of the 3 housing-law news items.
- [ ] Verify image rights, alt text and necessity for 5 external CSS photos.
- [ ] Compare all 33 routes with Webflow on desktop/mobile, including forms.
- [ ] Audit CMS URLs, canonical, 301 redirects, sitemap and JSON-LD.
- [ ] Deploy an isolated permanent staging with access controls, monitoring,
      encrypted backups and tested restore.
- [ ] Complete security, accessibility, load and end-to-end acceptance.
- [ ] Obtain explicit legal/editorial, SEO and security approval.

External images are pointers only in migration/webflow-external-media.json.
Do not assume Unsplash image URLs grant redistribution or rights to use them.
Inventory does not cover external embedded or responsive images.

Production requires SITE_CUTOVER=true, SITE_RELEASE_APPROVED=yes, and a
valid HTTPS SITE_URL outside Webflow. Keep Draft PR #2 and the old site
unchanged until final sign-off. Never switch DNS automatically.
