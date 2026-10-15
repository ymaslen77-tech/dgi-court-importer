import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const catalog=JSON.parse(readFileSync(new URL("../../apps/web/src/data/housing-law-catalog.json",import.meta.url),"utf8"));
const housing=JSON.parse(readFileSync(new URL("../../apps/web/src/data/housing-guides.json",import.meta.url),"utf8"));
const pages=Array.from({length:6},(_,i)=>JSON.parse(readFileSync(
 new URL(`../../apps/web/src/data/pages-${i}.json`,import.meta.url),"utf8"))).flat();
const slugs=new Set([...housing.guides.map(x=>x.slug),...pages.map(x=>x.slug)]);
test("normative catalog has 19 distinct non-approved law entries",()=>{
 assert.equal(catalog.laws.length,19);
 assert.equal(new Set(catalog.laws.map(x=>x.id)).size,19);
 for(const item of catalog.laws){
  assert.equal(item.currentVersionVerified,false);
  assert.equal(item.approved,false);
  assert.ok(item.title.length>12 && item.subject.length>25);
  assert.ok(["moscow","federal"].includes(item.jurisdiction));
  assert.ok(["primary_historical","historical_pdf","link_not_verified","official_text_needed"].includes(item.sourceStatus));
  if(item.sourceUrl){
   const u=new URL(item.sourceUrl);
   assert.equal(u.protocol,"https:");
   assert.ok(["mos.ru","www.mos.ru"].includes(u.hostname));
  } else {
   assert.equal(item.sourceStatus,"official_text_needed");
  }
  for(const slug of item.related)assert.ok(slugs.has(slug),`Broken related legislation link: ${slug}`);
 }
});
test("new legislative catalog route fails closed on live and is not in sitemap",()=>{
 const route=readFileSync(new URL("../../apps/web/src/app/[...slug]/page.tsx",import.meta.url),"utf8");
 const sitemap=readFileSync(new URL("../../apps/web/src/app/sitemap.ts",import.meta.url),"utf8");
 const article=readFileSync(new URL("../../apps/web/src/components/MigratedArticle.tsx",import.meta.url),"utf8");
 assert.match(route,/!siteIsLive && slug === housingLawCatalogSlug/);
 assert.match(route,/index: false, follow: false/);
 assert.ok(!sitemap.includes("housingLawCatalogSlug"));
 assert.match(article,/!siteIsLive && page.slug === "normativnye-akty"/);
});
