import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {test} from "node:test";
const manifest=JSON.parse(readFileSync(new URL("../../migration/webflow-seo-manifest.json",import.meta.url),"utf8"));
const pages=Array.from({length:6},(_,i)=>JSON.parse(
 readFileSync(new URL(`../../apps/web/src/data/pages-${i}.json`,import.meta.url),"utf8")
)).flat();
test("Webflow site ID, static routes and metadata match reference snapshot",()=>{
 assert.equal(manifest.siteId,"6aca6bde03aad0f2e3c19259");
 assert.equal(manifest.pages.length,33);
 assert.equal(pages.length,33);
 const bySlug=new Map(pages.map(x=>[x.slug,x]));
 assert.equal(bySlug.size,33);
 for(const original of manifest.pages) {
   assert.match(original.webflowId,/^[a-f\d]{24}$/);
   assert.equal(original.path,original.slug?`/${original.slug}`:"/");
   const migrated=bySlug.get(original.slug);
   assert.ok(migrated,`Missing legacy route ${original.path}`);
   assert.equal(migrated.seoTitle,original.seoTitle,`SEO title drift: ${original.path}`);
   assert.equal(migrated.description,original.seoDescription,`SEO description drift: ${original.path}`);
   assert.equal(migrated.source,`https://dgimos.webflow.io${original.path}`);
   assert.ok(migrated.blocks.length>=5,`Content incomplete: ${original.path}`);
 }
});
