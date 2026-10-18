import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const queue=JSON.parse(readFileSync(new URL("../../migration/court-legal-acceptance-queue-2026-10-15.json",import.meta.url),"utf8"));
const notes=queue.cassationDispositionObservations;
test("three official cassation operative-section extracts have exact case IDs, no release",()=>{
 assert.equal(queue.cases.length,37);
 assert.equal(notes.length,3);
 assert.equal(queue.counts.cassationOperativePartsObserved,3);
 assert.equal(queue.counts.fullyVerifiedJudicialActs,0);
 assert.equal(queue.counts.fullTextChainsAccepted,0);
 assert.equal(new Set(notes.map(x=>x.uid)).size,3);
 for(const x of notes){
  const c=queue.cases.find(y=>y.slug===x.slug);
  assert.ok(c?.metadataIdentityChecked);
  assert.equal(x.officialCaseUrl,c.officialCaseUrl);
  assert.equal(new URL(x.officialCaseUrl).hostname,"2kas.sudrf.ru");
  assert.match(x.uid,/^77RS\d{4}-\d{2}-\d{4}-\d{6}-\d{2}$/);
  assert.equal(x.officialTextObserved,true);
  assert.equal(x.operativeSectionTranscribedForResearch,true);
  for(const field of ["fullTextCompletenessVerified","firstAndAppealFullActsVerified","laterReviewChecked","legalReasoningAccepted","personalDataApproved","legalSignOff","publicationApproved"])
   assert.equal(x[field],false,`Unauthorized legal acceptance: ${x.slug} ${field}`);
  assert.ok(x.followUp.length>45);
 }
});
test("do not misclassify land lease and unclaimed nonresidential property as residential disputes",()=>{
 const classification=Object.fromEntries(notes.map(x=>[x.slug,x.category]));
 assert.equal(classification["kass-88-21277-2026"],"housing_resettlement");
 assert.equal(classification["kass-88-3117-2026"],"land_lease_not_housing");
 assert.equal(classification["kass-88-13792-2026"],"urban_property_nonresidential");
 const conflict=notes.find(x=>x.slug==="kass-88-13792-2026");
 assert.equal(conflict.headerOperativeConsistency,"discrepancy_needs_manual_review");
 assert.ok(conflict.discrepancy.length>100);
 assert.equal(conflict.publicationApproved,false);
});
