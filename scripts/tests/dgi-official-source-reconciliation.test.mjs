import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const matrix=read("migration/dgi-20-acts-official-reconciliation-2026-10-15.json");
const comprehensive=read("migration/housing-comprehensive-legal-acceptance-2026-10-15.json");
const triage=read("migration/court-unresolved-34-triage-2026-10-15.json");
const queue=read("migration/court-legal-acceptance-queue-2026-10-15.json");
test("all 20 legal records have nonempty source-specific audit instructions",()=>{
 assert.equal(matrix.sources.length,20);
 assert.deepEqual(matrix.sources.map(x=>x.id).sort(),comprehensive.legislation.map(x=>x.id).sort());
 assert.equal(matrix.publicationGate,"closed");
 for(const item of matrix.sources){
  assert.equal(item.reviewSteps.length,2);
  assert.ok(item.reviewSteps.every(x=>x.length>30));
  for(const f of ["amendmentsComplete","fullCurrentEditionVerified","allAnnexesVerified","serviceRulesVerified","publicationApproved"])
   assert.equal(item[f],false,`Unsupported approval: ${item.id} ${f}`);
 }
 assert.deepEqual(matrix.awaitingAdditionalMoscowActs.map(x=>x.act),["362-ПП от 06.06.2006","219-ПП от 23.04.2014","1105-ПП от 21.07.2021"]);
});
test("all unresolved court intakes and new docket observations remain unpublished",()=>{
 assert.equal(triage.cases.length,34);
 assert.equal(queue.cases.length,37);
 assert.equal(queue.additionalAppellateDocketLeads.length,2);
 assert.equal(queue.counts.fullyVerifiedJudicialActs,0);
 for(const e of queue.additionalAppellateDocketLeads){
  assert.equal(e.verifiedJudgment,false);
  assert.equal(e.legalSignOff,false);
  assert.equal(e.publicationApproved,false);
  assert.equal(e.officialIndividualCaseUrl,null);
 }
 for(const row of triage.cases){
  assert.equal(row.publicationApproved,false);
  assert.equal(row.allInstancesVerified,false);
  assert.equal(row.legalOutcomeApproved,false);
 }
});
test("the 2025 federal housing amendment is research evidence, not the effective 2026 edition",()=>{
 const c=comprehensive.legislation.find(x=>x.id==="housing-code");
 assert.match(c.additionalFederalPublicationLead.act,/530-ФЗ/);
 assert.equal(c.additionalFederalPublicationLead.fullTextChecked,false);
 assert.equal(c.additionalFederalPublicationLead.effectiveDateChecked,false);
 assert.equal(c.additionalFederalPublicationLead.completeConsolidatedEditionVerified,false);
 assert.equal(c.publicationApproved,false);
});
