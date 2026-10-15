import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=path=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const catalog=JSON.parse(read("apps/web/src/data/dgi-service-register.json"));
const guides=JSON.parse(read("apps/web/src/data/housing-guides.json"));
const legacy=Array.from({length:6},(_,i)=>JSON.parse(read(`apps/web/src/data/pages-${i}.json`))).flat();
const existing=new Set([...guides.guides.map(x=>x.slug),...legacy.map(x=>x.slug)]);

test("four official-source DGI services remain non-approved until current regulations checked",()=>{
 assert.equal(catalog.services.length,4);
 assert.equal(catalog.status,"editorial_draft");
 assert.equal(new Set(catalog.services.map(x=>x.id)).size,4);
 const accepted=new Set(["www.mos.ru","mos.ru"]);
 for(const item of catalog.services){
  assert.ok(item.title.length>25 && item.law.length>25);
  assert.ok(existing.has(item.guideSlug),`Broken guide: ${item.id}`);
  assert.equal(item.procedureVerified,false);
  assert.equal(item.currentRevisionVerified,false);
  assert.equal(item.publicationApproved,false);
  assert.ok(item.remaining.length>40);
  const url=new URL(item.officialSource);
  assert.equal(url.protocol,"https:");
  assert.ok(accepted.has(url.hostname),`Not an official source: ${item.id}`);
 }
});

test("all new P0 routes have independent legal explanations and source caveats",()=>{
 const slugs=[
  "arhivnye-prava-na-zhile-do-1998",
  "perevod-zhilogo-pomeshcheniya-v-nezhiloe",
  "predostavlenie-zhilya-po-sotsnaymu-moskva",
  "izyatie-zhilogo-pomeshcheniya-vozmeshchenie",
 ];
 for(const slug of slugs){
  const item=guides.guides.find(x=>x.slug===slug);
  assert.ok(item,`Missing guide: ${slug}`);
  assert.equal(item.stage,"editorial_draft");
  assert.equal(item.steps.length,4);
  assert.ok(item.summary.length>140 && item.legal.length>190);
  assert.ok(item.objection.length>150);
  assert.ok(item.sources.length>=3);
  assert.ok(item.sources.every(x=>x.note.length>35));
  assert.ok(item.related.every(x=>existing.has(x)));
  assert.ok(!legacy.some(x=>x.slug===slug));
 }
});

test("new registry cannot render or index when SITE_CUTOVER is enabled",()=>{
 const route=read("apps/web/src/app/[...slug]/page.tsx");
 const sitemap=read("apps/web/src/app/sitemap.ts");
 const shell=read("apps/web/src/components/PageShell.tsx");
 assert.ok(route.includes("!siteIsLive && slug === dgiServiceRegistrySlug"));
 assert.ok(route.includes("!siteIsLive && findHousingGuide(slug)"));
 assert.ok(route.includes("index: false, follow: false"));
 assert.ok(!sitemap.includes("dgiServiceRegistrySlug"));
 assert.ok(shell.includes('href: "/reestr-gosuslug-dgi"'));
});
