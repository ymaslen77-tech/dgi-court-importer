# Webflow CMS URL preservation audit

Published Webflow inventory confirmed for source site 6aca6bde03aad0f2e3c19259:
- 33 public static URLs, including the homepage, preserved as Next.js routes.
- 22 formerly public CMS court-card paths under /dgi-court-cases/{slug}.
- 28 other CMS records were drafts (15 court, 4 legal documents,
  6 legal situations and 3 news items). Drafts must not automatically appear
  in the new public sitemap or as rewritten articles.

The 22 court-card detail pages are restored as noindex archive metadata only;
no case outcome, act authenticity or appellate result is implied.
After independent review, legal situations, regulations and news articles can
be approved in Payload under the preserved nested collection/item slug;
unapproved items remain 404. The court-archive route intentionally overrides
the generic approved CMS route until a source-verified court-publication
workflow has been designed.

Source URLs and slugs are checked by scripts/tests/cms-url-coverage.test.mjs.
This is URL-coverage validation, NOT proof of current legal content, redirects,
external backlinks, canonical switch, design parity or search indexation.
Before production release, compare canonical links and run 301-redirect
tests against actual previously indexed URL variants. Do not invent redirects
where no legacy path exists.
