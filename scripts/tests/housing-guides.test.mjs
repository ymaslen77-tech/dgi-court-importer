import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const file = JSON.parse(readFileSync(new URL("../../apps/web/src/data/housing-guides.json", import.meta.url),"utf8"));
const legacy = Array.from({length:6},(_,i)=>JSON.parse(readFileSync(new URL(`../../apps/web/src/data/pages-${i}.json`, import.meta.url),"utf8"))).flat();
const known = new Set([...legacy.map(p=>p.slug),...file.guides.map(g=>g.slug)]);
test("eighteen draft routes and six existing landing-page supplements",()=>{
 assert.equal(file.guides.length,18);
 assert.equal(file.supplements.length,6);
 assert.equal(new Set(file.guides.map(g=>g.slug)).size,18);
 for(const s of file.supplements)assert.ok(legacy.some(p=>p.slug===s.slug));
});
test("all legal routes contain distinct practical instructions, references and guarded sources",()=>{
 for(const g of file.guides){
  assert.equal(g.stage,"editorial_draft");
  assert.equal(g.jurisdiction,"Москва");
  assert.ok(g.summary.length>80 && g.legal.length>30 && g.objection.length>70);
  assert.ok(g.documents.length>=3 && g.steps.length>=4 && g.sources.length>=1);
  assert.ok(!legacy.some(p=>p.slug===g.slug));
  assert.ok(/^[a-z0-9-]+$/.test(g.slug));
  for(const r of g.related)assert.ok(known.has(r),`Broken related link ${g.slug} -> ${r}`);
 }
 for(const page of file.supplements){
  assert.ok(page.intro.length>80 && page.steps.length>=4);
  assert.ok(page.authority.length>50 && page.decision.length>60 && page.risks.length>70);
  assert.ok(page.documents.length>=3);
  for(const r of page.related)assert.ok(known.has(r),`Broken supplement link ${r}`);
 }
});
test("sources are on explicitly approved official hosts, no invented publication statuses",()=>{
 const allow=new Set(["www.mos.ru","mos.ru","fr.mos.ru","vestnikmoscow.mos.ru","cdn.dom.gosuslugi.ru","rosreestr.gov.ru","www.gosuslugi.ru","www.mosgorbti.ru","tender.mos.ru"]);
 for(const item of [...file.guides,...file.supplements])for(const source of item.sources){
  const url=new URL(source.url);
  assert.equal(url.protocol,"https:");
  assert.ok(allow.has(url.hostname),`Non-official hostname ${url.hostname}`);
  assert.ok(source.note.length>0);
 }
});
test("new guide previews never enter production or live sitemap",()=>{
 const route=readFileSync(new URL("../../apps/web/src/app/[...slug]/page.tsx",import.meta.url),"utf8");
 const sitemap=readFileSync(new URL("../../apps/web/src/app/sitemap.ts",import.meta.url),"utf8");
 const article=readFileSync(new URL("../../apps/web/src/components/MigratedArticle.tsx",import.meta.url),"utf8");
 assert.ok(route.includes("!siteIsLive && findHousingGuide(slug)"));
 assert.ok(route.includes("index: false, follow: false"));
 assert.ok(article.includes("!siteIsLive && hasHousingSupplement(page.slug)"));
 assert.ok(article.includes("<HousingSupplement page={page} />"));
 assert.ok(!sitemap.includes("housingGuides"));
});
