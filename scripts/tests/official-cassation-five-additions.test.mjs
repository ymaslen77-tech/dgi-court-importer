import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=x=>JSON.parse(readFileSync(new URL("../../"+x,import.meta.url),"utf8"));
const q=load("migration/court-legal-acceptance-queue-2026-10-15.json");
const triage=load("migration/court-unresolved-34-triage-2026-10-15.json");
test("all eight prior official cassation case cards have individually sourced operative results",()=>{
 assert.equal(q.cassationDispositionObservations.length,3);
 assert.equal(q.additionalCassationDeterminations.length,5);
 assert.equal(q.counts.totalCassationOperativePartsObserved,8);
 assert.equal(q.counts.fullyVerifiedJudicialActs,0);
 const observed=[...q.cassationDispositionObservations,...q.additionalCassationDeterminations];
 assert.equal(new Set(observed.map(x=>x.slug)).size,8);
 const official=q.cases.filter(x=>x.metadataIdentityChecked);
 assert.equal(official.length,8);
 assert.deepEqual(official.map(x=>x.slug).sort(),observed.map(x=>x.slug).sort());
 for(const record of q.additionalCassationDeterminations){
  const src=official.find(x=>x.slug===record.slug);
  assert.equal(record.officialCaseUrl,src.officialCaseUrl);
  assert.equal(new URL(record.officialCaseUrl).hostname,"2kas.sudrf.ru");
  assert.match(record.uid,/^77RS\d{4}-\d{2}-\d{4}-\d{6}-\d{2}$/);
  assert.equal(record.caseSpecificOfficialActFound,true);
  assert.equal(record.operativePartMatchesOfficialText,true);
  assert.ok(record.reportedDisposition.length>70);
  assert.equal(record.fullCassationActLegalReasoningApproved,false);
  assert.equal(record.allPriorInstancesIndependentlyChecked,false);
  assert.equal(record.laterReviewChecked,false);
  assert.equal(record.legalSignoff,false);
  assert.equal(record.privacyApproved,false);
  assert.equal(record.publicationApproved,false);
 }
});
test("five new outcomes leave 29 unresolved and preserve housing/nonhousing distinctions",()=>{
 assert.equal(triage.cases.length,34);
 assert.equal(triage.stats.newlyObservedCassationOperativeParts,5);
 assert.equal(triage.stats.remainingWithNoObservedOperativeResult,29);
 assert.equal(triage.cases.filter(x=>x.subsequentCassationEvidence).length,5);
 const cases=Object.fromEntries(q.additionalCassationDeterminations.map(x=>[x.caseNumber,x.category]));
 assert.equal(cases["88-724/2026"],"housing_inheritance_escheat_eviction");
 assert.equal(cases["88-15955/2026"],"nonresidential_expropriation_compensation");
 assert.equal(cases["88-5020/2026"],"nonresidential_garage_ownership");
 assert.equal(cases["88-15278/2026"],"nonresidential_garage_compensation");
 for(const x of triage.cases.filter(x=>x.subsequentCassationEvidence)){
  assert.equal(x.subsequentCassationEvidence.verifiedFullChain,false);
  assert.equal(x.subsequentCassationEvidence.publicationApproved,false);
 }
});
