import { strict as assert } from "node:assert";
import { test } from "node:test";
import { readFileSync } from "node:fs";

const inventory=JSON.parse(readFileSync(new URL("../../migration/cms-inventory.json",import.meta.url),"utf8"));
const audit=JSON.parse(readFileSync(new URL("../../migration/cms-source-review-2026-10-14.json",import.meta.url),"utf8"));
const source=inventory.collections.flatMap(group=>group.items.map(item=>({collection:group.slug,...item})));

test("source audit covers all 50 documents and does not change CMS publication state",()=>{
 assert.equal(source.length,50);
 assert.equal(audit.records.length,50);
 const ids=new Set();
 const expected=new Map(source.map(x=>[x.id,x]));
 for(const record of audit.records){
  const old=expected.get(record.sourceId);
  assert.ok(old,`Unknown CMS source id ${record.sourceId}`);
  assert.equal(record.slug,old.slug);
  assert.equal(record.collection,old.collection);
  assert.equal(record.title,old.title);
  assert.equal(record.approvedForPublication,false);
  assert.equal(record.legalActVerified,false);
  assert.equal(record.reviewDate,audit.checkedOn);
  assert.ok(record.pending.length>=40);
  assert.ok(!ids.has(record.sourceId));
  ids.add(record.sourceId);
 }
 assert.equal(ids.size,50);
 assert.deepEqual(audit.counts,{
  "dgi-court-cases":37,
  "dgi-legal-documents":4,
  "dgi-legal-situations":6,
  "housing-law-news":3,
 });
 assert.ok(source.every(x=>x.verified===false));
});
test("court cards with no exact official case source cannot claim verified decisions",()=>{
 const courts=audit.records.filter(x=>x.collection==="dgi-court-cases");
 assert.equal(courts.length,37);
 assert.equal(courts.filter(x=>x.reviewStatus==="court_primary_url_missing").length,28);
 assert.equal(courts.filter(x=>x.reviewStatus==="court_generic_search_not_primary").length,1);
 assert.equal(courts.filter(x=>x.reviewStatus==="court_official_case_identity_checked").length,8);
 assert.equal(courts.filter(x=>x.reviewStatus==="court_official_case_url_unchecked").length,0);
 for(const item of courts){
  assert.equal(item.legalActVerified,false);
  if(item.sourceIdentityConfirmed){
   assert.ok(item.sourceUrl.startsWith("https://2kas.sudrf.ru/modules.php?"));
   assert.ok(item.slug.startsWith("kass-88-"));
   assert.equal(item.officialActLocated,true);
  }
 }
});
test("legal acts, situations and news remain non-publishable without full source review",()=>{
 for(const record of audit.records.filter(x=>x.collection!=="dgi-court-cases")){
  assert.equal(record.sourceIdentityConfirmed,false);
  assert.equal(record.approvedForPublication,false);
  assert.ok(["official_historical_document_revision_unverified","topic_existing_page_source_unverified","secondary_news_primary_source_unverified"].includes(record.reviewStatus));
 }
});

test("all 50 source CMS entries were cross-checked for content completeness and publication safety",()=>{
 for(const record of audit.records){
  const state=record.sourceCmsCheck;
  assert.ok(state,`No CMS read for ${record.slug}`);
  assert.equal(state.checkedOn,audit.checkedOn);
  assert.equal(state.sourceVersion,"live collection read");
  assert.ok(Number.isInteger(state.fieldsPresent)&&state.fieldsPresent>0);
  assert.equal(state.reviewedByEditor,false);
  assert.equal(record.approvedForPublication,false);
 }
 const situ=audit.records.filter(x=>x.collection==="dgi-legal-situations");
 const news=audit.records.filter(x=>x.collection==="housing-law-news");
 assert.ok(situ.every(x=>x.sourceCmsCheck.richTextFound));
 assert.ok(news.every(x=>x.sourceCmsCheck.richTextFound));
 assert.equal(audit.records.filter(x=>!x.sourceCmsCheck.isSourceDraft).length,22);
 const verdicts=audit.records.filter(x=>x.collection==="dgi-court-cases"&&x.sourceCmsCheck.caseVerdictFieldPopulated);
 assert.equal(verdicts.length,29);
 assert.ok(verdicts.every(x=>!x.legalActVerified));
});
