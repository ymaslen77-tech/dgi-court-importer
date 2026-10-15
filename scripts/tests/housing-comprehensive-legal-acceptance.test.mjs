import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const audit=read("migration/housing-comprehensive-legal-acceptance-2026-10-15.json");
const law=read("apps/web/src/data/housing-law-catalog.json");
const guide=read("apps/web/src/data/housing-guides.json");
const services=read("apps/web/src/data/dgi-service-register.json");
const courts=read("migration/court-legal-acceptance-queue-2026-10-15.json");

test("every catalog law, guide and service has exactly one private legal signoff record",()=>{
  assert.equal(law.laws.length,20);assert.equal(guide.guides.length,18);assert.equal(services.services.length,7);
  assert.deepEqual(audit.legislation.map(x=>x.id).sort(),law.laws.map(x=>x.id).sort());
  assert.deepEqual(audit.instructions.map(x=>x.slug).sort(),guide.guides.map(x=>x.slug).sort());
  assert.deepEqual(audit.serviceChecks.map(x=>x.id).sort(),services.services.map(x=>x.id).sort());
  assert.equal(audit.courtReview.cases,courts.cases.length);
  assert.equal(audit.courtReview.legalActVerified,0);
});

test("partial official documentary findings never authorize an effective legal edition",()=>{
  for(const item of audit.legislation){
    assert.equal(item.lastEffectiveConsolidatedEditionVerified,false);
    assert.equal(item.allAmendmentsAndAnnexesVerified,false);
    assert.equal(item.legalSignoff,false);
    assert.equal(item.publicationApproved,false);
    assert.ok(item.pending.length>65);
    if(item.officialResearchEvidence){
      const uri=new URL(item.officialResearchEvidence.source);
      assert.equal(uri.protocol,"https:");
      assert.ok(["www.mos.ru","vestnikmoscow.mos.ru"].includes(uri.hostname));
    }
  }
  for(const item of audit.instructions){
    for(const field of ["currentEffectiveActsVerified","exactApplicantEligibilityVerified",
      "exhaustiveDocumentsVerified","deadlineAndDecisionVerified","rejectionAndAppealVerified","legalSignoff","publicationApproved"])
      assert.equal(item[field],false,`Unapproved legal instruction ${item.slug}: ${field}`);
    assert.ok(item.pending.length>50);
  }
  for(const service of audit.serviceChecks){
    assert.equal(service.currentRevisionVerified,false);
    assert.equal(service.procedureVerified,false);
    assert.equal(service.publicationApproved,false);
  }
});

test("official 820-PP has multiple amendments, including 521-PP appendix six",()=>{
  const entry=audit.legislation.find(x=>x.id==="521-pp");
  assert.match(entry.officialResearchEvidence.act,/820-ПП/);
  assert.equal(entry.officialResearchEvidence.effective,"2026-04-15");
  assert.match(entry.officialResearchEvidence.scope,/appendix 6/);
  assert.ok(!entry.officialResearchEvidence.scope.includes("Changes only appendix"));
  const impact=read("migration/820-pp-official-amendment-impact-2026-10-15.json");
  assert.equal(impact.effectiveFrom,"2026-04-15");
  assert.deepEqual(impact.affected.map(x=>x.id),["362-pp","219-pp","521-pp","1105-pp"]);
  assert.ok(impact.affected.every(x=>x.pending.length>45));
  assert.equal(impact.legalSignoff,false);
  assert.equal(impact.publicationApproved,false);
  const city=law.laws.find(x=>x.id==="521-pp").confirmedAmendment;
  assert.equal(city.effectiveDate,"2026-04-15");
  assert.equal(city.currentConsolidatedEditionChecked,false);
  assert.equal(city.publicationApproved,false);
  const archive=law.laws.find(x=>x.id==="132-pp").confirmedAmendment;
  assert.match(archive.act,/2895-ПП/);
  assert.equal(archive.currentConsolidatedEditionChecked,false);
});

test("820-PP public-facing wording distinguishes application changes from periodic review",()=>{
 const guide=read("apps/web/src/data/housing-guides.json");
 const candidate=guide.guides.find(x=>x.slug==="priznanie-maloimushchim-dlya-zhilishchnogo-ucheta");
 const periodic=guide.guides.find(x=>x.slug==="pereregistratsiya-zhilishchnyy-uchet");
 const index=guide.supplements.find(x=>x.slug==="zhilishchnaya-ochered");
 const journal="vestnikmoscow.mos.ru/wp-content/uploads/2026/03/";
 for(const row of [candidate,periodic,index]){
   assert.ok(row.sources.some(x=>x.url.includes(journal)));
 }
 assert.match(candidate.legal,/820-ПП/);
 assert.match(periodic.legal,/не подтверждает текущую редакцию приказа № 286/);
 assert.match(index.risks,/приказа № 286|перерегистрации/);
});
