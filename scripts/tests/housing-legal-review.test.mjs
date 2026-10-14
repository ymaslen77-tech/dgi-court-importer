import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const ledger=JSON.parse(readFileSync(new URL("../../migration/housing-legal-review.json",import.meta.url),"utf8"));
const data=JSON.parse(readFileSync(new URL("../../apps/web/src/data/housing-guides.json",import.meta.url),"utf8"));
const norm=new Set(["primary_text_checked","historical_primary_link","norm_crosschecked","primary_help_checked","help_source_checked","official_portal_only","agency_not_confirmed","needs_legal_review"]);
const origin=new Set(["mos.ru","www.mos.ru","fr.mos.ru","cdn.dom.gosuslugi.ru","rosreestr.gov.ru","www.gosuslugi.ru","www.mosgorbti.ru","tender.mos.ru"]);

test("legal review covers each public-facing staging item exactly once",()=>{
 const slugs=data.guides.map(x=>x.slug).sort();
 const reviews=ledger.guides.map(x=>x.slug).sort();
 assert.deepEqual(reviews,slugs);
 assert.deepEqual(ledger.supplements.map(x=>x.slug).sort(),data.supplements.map(x=>x.slug).sort());
 assert.equal(new Set(reviews).size,data.guides.length);
 assert.equal(new Set(ledger.supplements.map(x=>x.slug)).size,data.supplements.length);
});
test("legal review cannot pass solely because a source exists",()=>{
 for(const item of [...ledger.guides,...ledger.supplements]){
  assert.equal(item.checkedOn,ledger.auditDate);
  assert.equal(item.currentRevisionVerified,false);
  assert.equal(item.procedureVerified,false);
  assert.equal(item.publicationApproved,false);
  assert.ok(norm.has(item.sourceStatus));
  assert.ok(item.nextReview.length>40);
 }
 assert.match(ledger.publicationRule,/official consolidated effective version/i);
});
test("every substantiated norm points to an official source; all links are validated allowlist",()=>{
 for(const item of ledger.guides) {
  const guide=data.guides.find(x=>x.slug===item.slug);
  assert.ok(guide);
  assert.ok(guide.sources.some(s=>s.url===item.referenceUrl),`Evidence source missing from ${item.slug}`);
  const u=new URL(item.referenceUrl);
  assert.equal(u.protocol,"https:");
  assert.ok(origin.has(u.hostname));
 }
 for(const item of [...data.guides,...data.supplements]){
  for(const source of item.sources){
   assert.ok(origin.has(new URL(source.url).hostname),`Foreign source in ${item.slug}: ${source.url}`);
   assert.ok(source.note.length>15);
  }
 }
});
test("source corrections: ЖКУ provider and citizen-oriented УК guide",()=>{
 const get=slug=>data.guides.find(x=>x.slug===slug);
 assert.match(get("subsidiya-na-oplatu-zhku-moskva").legal,/Городской центр жилищных субсидий/);
 assert.ok(get("proverka-upravlyayushchey-kompanii").sources.some(s=>s.url.includes("/_citizen/")));
 assert.ok(get("deprivatizatsiya-kvartiry-moskva").sources.some(s=>s.url.endsWith("/1368-PP.pdf")));
 assert.match(get("pereregistratsiya-zhilishchnyy-uchet").legal,/пять лет/);
});
