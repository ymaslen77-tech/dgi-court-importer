import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const load=(p)=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
const cms=load("../../migration/cms-inventory.json");
const pages=load("../../migration/webflow-seo-manifest.json");
const oldCases=load("../../apps/web/src/data/legacy-cases.json");
test("every formerly public Webflow URL is preserved without collisions",()=>{
  const staticPaths=new Set(pages.pages.map(p=>p.path));
  assert.equal(staticPaths.size,33);
  const caseCollection=cms.collections.find(c=>c.slug==="dgi-court-cases");
  const published=caseCollection.items.filter(x=>x.status==="legacy_public_unverified");
  const publicCases=new Set(published.map(x=>"/dgi-court-cases/"+x.slug));
  assert.equal(publicCases.size,22);
  assert.equal(oldCases.cases.length,22);
  const protectedDetailRoute=readFileSync(
    new URL("../../apps/web/src/app/dgi-court-cases/[slug]/page.tsx",import.meta.url),"utf8");
  assert.match(protectedDetailRoute,/index: false, follow: false/);
  assert.match(protectedDetailRoute,/redirect\("\/sudebnaya-praktika-dgi"\)/);
  assert.doesNotMatch(protectedDetailRoute,/legacyCases.find/);
  const migratedSlugs=new Set(oldCases.cases.map(x=>x.slug));
  for(const item of published)assert.ok(migratedSlugs.has(item.slug),
    "Missing formerly public CMS case: "+item.slug);
  for(const path of publicCases)assert.ok(!staticPaths.has(path),
    "Court detail conflicts with static route: "+path);
});
test("unpublished CMS draft paths are not in public migrated archive",()=>{
  const drafts=cms.collections.flatMap(c=>c.items
    .filter(item=>item.status==="draft").map(item=>"/"+c.slug+"/"+item.slug));
  assert.equal(drafts.length,28);
  assert.ok(drafts.every(x=>!pages.pages.some(p=>p.path===x)));
  assert.equal(new Set(drafts).size,drafts.length);
});
