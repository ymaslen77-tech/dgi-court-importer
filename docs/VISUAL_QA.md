# Source/target design screenshot comparison

Workflow: .github/workflows/visual-parity.yml.
It captures Webflow and local Next.js screenshots for six representative
routes at desktop 1280x800 and mobile 390x844.

Download the GitHub Actions design-comparison artifact and compare each
webflow.png/next.png pair. Track discrepancies in navigation, backgrounds,
typography, layout, forms and mobile rendering. Screenshots do not confer
media rights and do not authorize a release.

This is a sample, NOT full manual acceptance of all 33 static routes.

## Findings from source/target screenshot inspection (2026-10-14)

- Home: original red emphasis and paired actions were missing in the first Next.js implementation. Dedicated home styling and navigation have been added; final visual acceptance remains pending.
- Privatization, social rent and renovation: Webflow uses light introductory headings, a red/black navigation strip and a tinted legal disclaimer. Initial Next.js used a generic dark hero; a thematic variant has been implemented.
- Featured Webflow sections use dark cards and background photographs. Next.js still renders recovered text blocks primarily as a continuous article. A structural conversion is required for pixel parity; rights for external photos remain unverified, so source assets were not copied.
- The first reference run included six representative pages on desktop/mobile, not all 33. New screenshot runs should be reviewed against this baseline; passing a test does not prove design identity.
- Court catalog, news layouts, menus, footer, icons, responsiveness and every remaining published page require individual visual sign-off.

First paired screenshot run: https://github.com/ymaslen77-tech/dgi-court-importer/actions/runs/38518282581

**Decision:** design parity not yet approved. Do not use SITE_RELEASE_APPROVED=yes on this basis.
