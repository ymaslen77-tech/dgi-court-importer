import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const source=read("migration/cms-source-review-2026-10-14.json").records.filter(x=>x.collection==="dgi-court-cases");
const queue=read("migration/court-legal-acceptance-queue-2026-10-15.json");

test("all thirty-seven court records have exactly one legal review work item",()=>{
 assert.equal(source.length,37);
 assert.equal(queue.cases.length,37);
 assert.equal(new Set(queue.cases.map(x=>x.slug)).size,37);
 assert.deepEqual(queue.cases.map(x=>x.slug).sort(),source.map(x=>x.slug).sort());
 assert.equal(queue.counts.missingOfficialCaseUrl,28);
 assert.equal(queue.counts.genericSearchInsteadOfAct,1);
 assert.equal(queue.counts.officialCaseIdentityOnly,8);
 assert.equal(queue.counts.fullyVerifiedJudicialActs,0);
});

test("source metadata cannot be promoted to a confirmed judgment",()=>{
 assert.equal(queue.publicationStatus,"blocked");
 for(const item of queue.cases) {
  const original=source.find(x=>x.slug===item.slug);
  assert.equal(item.caseNumber,original.caseNumber??null);
  assert.equal(item.originalSourceStatus,original.reviewStatus);
  assert.equal(item.metadataIdentityChecked,original.sourceIdentityConfirmed===true);
  assert.equal(item.officialCaseUrl,original.sourceIdentityConfirmed?original.sourceUrl:null);
  for(const field of ["judicialActTextChecked","allInstancesChecked","reasoningChecked","privacyApproved","legalSignOff","publicationApproved"])
   assert.equal(item[field],false,`Unsafe approval of ${item.slug}: ${field}`);
  assert.ok(item.requiredAction.length>60);
 }
});
