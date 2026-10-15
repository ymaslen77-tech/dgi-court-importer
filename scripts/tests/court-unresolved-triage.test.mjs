import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const queue=load("migration/court-legal-acceptance-queue-2026-10-15.json");
const triage=load("migration/court-unresolved-34-triage-2026-10-15.json");
test("all 34 court cases not included among three researched cassation outcomes are triaged",()=>{
 const observed=new Set(queue.cassationDispositionObservations.map(x=>x.slug));
 const outstanding=queue.cases.filter(x=>!observed.has(x.slug));
 assert.equal(outstanding.length,34);
 assert.equal(triage.cases.length,34);
 assert.equal(new Set(triage.cases.map(x=>x.slug)).size,34);
 assert.deepEqual(triage.cases.map(x=>x.slug).sort(),outstanding.map(x=>x.slug).sort());
 assert.equal(triage.stats.reviewedAsIntake,34);
 assert.equal(triage.stats.fullJudicialChainsApproved,0);
 assert.equal(queue.counts.fullyVerifiedJudicialActs,0);
});
test("two official appeal list matches are metadata research only, never approved judgments",()=>{
 assert.equal(queue.additionalAppellateDocketLeads.length,2);
 assert.equal(triage.stats.additionalOfficialDocketListMatches,2);
 const leads=Object.fromEntries(queue.additionalAppellateDocketLeads.map(x=>[x.slug,x]));
 assert.equal(leads["decision-02-4422-2026-additional-10"].appellateNumber,"33-51761/2026");
 assert.equal(leads["decision-02-4422-2026-additional-10"].scheduledHearingDate,"2026-10-26");
 assert.equal(leads["decision-02-7102-2025-additional-5"].complaintNumber,"Ж-40273/2026");
 for(const item of triage.cases){
  assert.ok(item.manualChecks.length>=5);
  assert.ok(item.nextAction.length>35);
  for(const flag of ["fullActTextVerified","allInstancesVerified","legalOutcomeApproved","personalDataReviewed","publicationApproved"])
   assert.equal(item[flag],false,`Unsafe approval ${item.slug}`);
  const evidence=item.officialDocketListingLead;
  if(evidence){
    const q=leads[item.slug];
    assert.ok(q);
    assert.equal(evidence.url,q.source);
    assert.equal(evidence.matchedLowerCaseNumber,item.caseNumber);
    assert.equal(q.officialIndividualCaseUrl,null);
    assert.equal(q.uid,null);
    assert.equal(q.verifiedJudgment,false);
    assert.equal(q.legalSignOff,false);
    assert.equal(q.publicationApproved,false);
    assert.equal(new URL(q.source).hostname.endsWith("mos-gorsud.ru"),true);
  }
 }
});
