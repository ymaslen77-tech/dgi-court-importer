import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {summarizeEligibility,hasDocumentedLegalSignoff} from "../seo-release-eligibility.mjs";
const load=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const pages=Array.from({length:6},(_,i)=>load(`apps/web/src/data/pages-${i}.json`)).flat();
const state={pages,acts:load("apps/web/src/data/housing-law-catalog.json"),services:load("apps/web/src/data/dgi-service-register.json"),guides:load("apps/web/src/data/housing-guides.json"),remediation:load("migration/housing-legal-remediation-2026-10-18.json")};
test("owner-released public URLs may index without treating all draft laws and procedures as approved",()=>{
 const r=summarizeEligibility(state);
 assert.equal(r.notAnOnlineOrHumanLegalSignoff,true);
 assert.equal(r.allContentLegallyApproved,false);
 assert.equal(r.indexationDecision,"PUBLIC_SITE_INDEXATION_ALLOWED_DRAFTS_EXCLUDED");
 assert.equal(r.ownerReleasedExistingPublicPages,33);
 assert.equal(r.publicSiteIndexingAllowedWithDraftsRestricted,true);
 assert.equal(r.totalDrafts.staticPages,33);
 assert.equal(r.totalDrafts.acts,20);
 assert.equal(r.totalDrafts.services,7);
 assert.equal(r.totalDrafts.guides,18);
 assert.equal(r.eligibleDrafts.acts,0);
 assert.equal(r.eligibleDrafts.services,0);
 assert.equal(r.eligibleDrafts.staticPages,0);
 assert.equal(r.blockers.some(x=>x.type==="incomplete_topic_inventory"),true);
});
test("two Moscow acts numbered 521-PP have distinct dates and cannot be conflated",()=>{
 const r=summarizeEligibility(state);
 assert.ok(r.identityWarnings.includes("same-number-different-act-521-pp"));
 const x=state.remediation.sourceIdentityWarnings[0];
 assert.equal(x.targetAct.number,x.distinctAct.number);
 assert.notEqual(x.targetAct.date,x.distinctAct.date);
 assert.equal(x.targetAct.date,"2014-09-10");
 assert.equal(x.distinctAct.date,"2026-03-11");
 assert.equal(x.doNotMerge,true);
});
test("status cannot be inferred merely by marking one act approved",()=>{
 const clone=structuredClone(state);
 clone.acts.laws[0].currentVersionVerified=true;
 clone.acts.laws[0].publicationApproved=true;
 assert.equal(summarizeEligibility(clone).indexationDecision,"BLOCKED_PENDING_VERIFIED_LEGAL_SIGNOFF");
});

test("flipping every approval flag cannot bypass source-by-source legal evidence",()=>{
 const clone=structuredClone(state);
 clone.pages.forEach(x=>x.editoriallyApproved=true);
 clone.acts.laws.forEach(x=>{x.currentVersionVerified=true;x.publicationApproved=true;});
 clone.services.services.forEach(x=>{x.procedureVerified=true;x.currentRevisionVerified=true;x.publicationApproved=true;});
 clone.guides.guides.forEach(x=>{x.stage="approved";x.publicationApproved=true;});
 clone.remediation.missingOrIncompleteTopics=[];
 const out=summarizeEligibility(clone);
 assert.equal(out.eligibleDrafts.staticPages,0);
 assert.equal(out.eligibleDrafts.acts,0);
 assert.equal(out.eligibleDrafts.services,0);
 assert.equal(out.eligibleDrafts.guides,0);
 assert.deepEqual(out.blockers.find(x=>x.type==="boolean_approval_without_legal_evidence"),
  {type:"boolean_approval_without_legal_evidence",count:78});
 assert.equal(out.indexationDecision,"BLOCKED_PENDING_VERIFIED_LEGAL_SIGNOFF");
});
test("documented legal signoff checks reviewer, date, amendments and official item URL",()=>{
 const proof={approved:true,reviewedBy:"legal-editor",reviewedOn:"2026-10-21",
  editionCheckedThrough:"2026-10-21",
  officialDocumentUrl:"https://www.mos.ru/upload/documents/oiv/10092014_521.pdf",
  reasonedFinding:"Full official text and legal amendments were checked against the publication.",
  allMaterialAmendmentsChecked:true,fullTextAndAnnexesChecked:true};
 assert.equal(hasDocumentedLegalSignoff({legalSignoff:proof}),true);
 assert.equal(hasDocumentedLegalSignoff({legalSignoff:{...proof,officialDocumentUrl:"https://example.com/legislation.pdf"}}),false);
 assert.equal(hasDocumentedLegalSignoff({legalSignoff:{...proof,officialDocumentUrl:"https://www.mos.ru/dgi/"}}),false);
 assert.equal(hasDocumentedLegalSignoff({legalSignoff:{...proof,reviewedOn:"2026-02-30"}}),false);
 assert.equal(hasDocumentedLegalSignoff({legalSignoff:{...proof,allMaterialAmendmentsChecked:false}}),false);
 assert.equal(hasDocumentedLegalSignoff({legalSignoff:{...proof,editionCheckedThrough:"2026-10-22"}}),false);
});
