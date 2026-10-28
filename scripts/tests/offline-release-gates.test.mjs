import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (name) => readFileSync(new URL("../../" + name, import.meta.url), "utf8");

test("production site is gated by individual legal-editorial approval", () => {
  const pages = read("apps/web/src/data/pages.ts");
  const adapter = read("apps/web/src/data/published.ts");
  const home = read("apps/web/src/app/page.tsx");
  const detail = read("apps/web/src/app/[...slug]/page.tsx");
  const markup = read("apps/web/src/components/SeoMarkup.tsx");
  assert.ok(pages.includes("siteIsLive && page.editoriallyApproved === true"));
  assert.ok(adapter.includes("editoriallyApproved: true"));
  assert.ok(adapter.includes("editorial_status = 'published'"));
  assert.ok(home.includes('!siteIsLive ? getMigratedPage("") : undefined'));
  assert.ok(detail.includes("!siteIsLive ? getMigratedPage(slug) : undefined"));
  assert.ok(home.includes("canIndexPage(page)"));
  assert.ok(detail.includes("canIndexPage(page)"));
  assert.ok(markup.includes("!canIndexPage(page)"));
});

test("draft and retired court archives stay out of sitemap while source-checked cases are discoverable", () => {
  const sitemap = read("apps/web/src/app/sitemap.ts");
  const courtIndex = read("apps/web/src/app/sudebnaya-praktika-dgi/page.tsx");
  const detail = read("apps/web/src/app/sudebnaya-praktika-dgi/[slug]/page.tsx");
  const adapter = read("apps/web/src/data/verified-courts.ts");
  assert.ok(sitemap.includes("listPublishedEditorialSlugs()"));
  assert.ok(!sitemap.includes("migratedPages"));
  assert.ok(sitemap.includes('slug.startsWith("dgi-court-cases/")'));
  assert.ok(sitemap.includes("listPublicCourtCaseSlugs()"));
  assert.ok(sitemap.includes("if (!siteIsLive) return []"));
  assert.ok(courtIndex.includes("index: siteIsLive, follow: siteIsLive"));
  assert.ok(detail.includes("getPublicCourtCase(slug)"));
  assert.ok(adapter.includes("isOfficialPublishedCase(row)"));
});

test("migration branch permits private Vercel previews but not unapproved public content", () => {
  for (const path of ["vercel.json", "apps/web/vercel.json"]) {
    const config = JSON.parse(read(path));
    assert.equal(config.git.deploymentEnabled["feature/dgi-offline-completion"], true);
  }
});
