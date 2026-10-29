import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const home = read("apps/web/src/app/page.tsx");
const catchall = read("apps/web/src/app/[...slug]/page.tsx");
const pages = read("apps/web/src/data/pages.ts");
const sitemap = read("apps/web/src/app/sitemap.ts");
const inventory = Array.from({length:6},(_,i)=>
  JSON.parse(read(`apps/web/src/data/pages-${i}.json`))).flat();

test("all 33 existing editorial URLs can render regardless of CMS publication availability",()=>{
  assert.equal(inventory.length,33);
  for (const slug of ["","zhilishchnyj-uchet","privatizaciya-zhilya",
    "socialnyj-naem","renovaciya-pereselenie","spory-s-dgi","normativnye-akty"]) {
    assert.ok(inventory.some(row => row.slug === slug),`Missing source article ${slug}`);
  }
  assert.equal(home.split('?? getMigratedPage("")').length-1,2);
  assert.equal(catchall.split("?? getMigratedPage(slug)").length-1,2);
  assert.doesNotMatch(home,/!siteIsLive\s*\?\s*getMigratedPage/);
  assert.doesNotMatch(catchall,/!siteIsLive\s*\?\s*getMigratedPage/);
});

test("existing 33 owner-released public snapshots can index, while CMS drafts remain restricted",()=>{
  assert.match(home,/canIndexPage\(page\)\s*\?\s*\{ index: true, follow: true \}\s*:\s*\{ index: false, follow: false \}/);
  assert.match(catchall,/canIndexPage\(page\)\s*\?\s*\{ index: true, follow: true \}\s*:\s*\{ index: false, follow: false \}/);
  assert.match(pages,/siteIsLive && page.editoriallyApproved === true/);
  assert.match(pages,/ownerReleasedLegacySlugs.has\(page.slug\)/);
  assert.match(pages,/getMigratedPage\(page.slug\) === page/);
  assert.match(sitemap,/listOwnerReleasedLegacySlugs\(\)/);
  assert.match(sitemap,/listPublishedEditorialSlugs\(\)/);
  assert.doesNotMatch(sitemap,/migratedPages/);
});
