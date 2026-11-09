import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const list = JSON.parse(read("apps/web/src/data/owner-released-legacy-pages.json"));
const pages = Array.from({length:6}, (_,i) =>
  JSON.parse(read(`apps/web/src/data/pages-${i}.json`))).flat();
const pageSource = read("apps/web/src/data/pages.ts");
const sitemap = read("apps/web/src/app/sitemap.ts");
const robots = read("apps/web/src/app/robots.ts");
const docker = read("Dockerfile.coolify");

test("explicit owner authorization covers exactly the fixed 33 existing public articles", () => {
  assert.equal(list.approved_existing_slugs.length,33);
  assert.equal(new Set(list.approved_existing_slugs).size,33);
  assert.deepEqual([...list.approved_existing_slugs].sort(),
    pages.map(x=>x.slug).sort());
  assert.ok(pages.some(x=>x.slug===""));
  for(const page of pages) {
    assert.equal(page.source,
      new URL(page.slug ? "/"+page.slug : "/", "https://dgimos.webflow.io").toString());
    assert.ok(page.blocks.length>=5);
    assert.ok(page.seoTitle.length>=20);
    assert.ok(page.description.length>=60);
    assert.notEqual(page.editoriallyApproved, true); // no fake CMS approvals
  }
  assert.match(pageSource,/getMigratedPage\(page.slug\) === page/);
  assert.match(pageSource,/ownerReleasedLegacySlugs.has\(page.slug\)/);
});

test("public sitemap lists owner-released pages without exposing archive or CMS drafts",()=>{
  assert.match(sitemap,/listOwnerReleasedLegacySlugs\(\)/);
  assert.match(sitemap,/listPublishedEditorialSlugs\(\)/);
  assert.match(sitemap,/slug === "sudebnaya-praktika-dgi"/);
  assert.match(sitemap,/slug === housingNewsBase.slice\(1\)/);
  assert.doesNotMatch(sitemap,/import.*legacy-cases/);
  assert.doesNotMatch(sitemap,/court-pdf-copies/);
});

test("robots is request-time and Docker image cannot hard-code closed release flags",()=>{
  assert.match(robots,/export const dynamic = "force-dynamic"/);
  assert.match(robots,/if \(!siteIsLive\)/);
  assert.match(robots,/allow:"\/"/);
  assert.match(robots,/disallow:\["\/admin\/","\/api\/"\]/);
  assert.doesNotMatch(docker,/^ENV SITE_CUTOVER=false/m);
  assert.doesNotMatch(docker,/^ENV SITE_RELEASE_APPROVED=no/m);
});
