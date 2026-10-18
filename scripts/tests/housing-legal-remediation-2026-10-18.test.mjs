import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = path => JSON.parse(readFileSync(new URL("../../" + path, import.meta.url), "utf8"));
const map = read("migration/housing-legal-remediation-2026-10-18.json");
const laws = read("apps/web/src/data/housing-law-catalog.json");
const services = read("apps/web/src/data/dgi-service-register.json");
const guides = read("apps/web/src/data/housing-guides.json");
const batches = Array.from({length:6}, (_,i) => read(`apps/web/src/data/pages-${i}.json`)).flat();
test("2026-10-18 gap register enumerates current drafts without increasing approval statuses", () => {
 assert.equal(map.generatedOn,"2026-10-18");
 assert.equal(map.completionStatus,"not_approved");
 assert.equal(map.publicReleaseAllowed,false);
 assert.equal(map.actChecks.length,20);
 assert.equal(map.serviceChecks.length,7);
 assert.equal(map.missingOrIncompleteTopics.length,14);
 assert.equal(new Set(map.missingOrIncompleteTopics.map(x=>x.id)).size,14);
 assert.deepEqual(map.actChecks.map(x=>x.id).sort(),laws.laws.map(x=>x.id).sort());
 assert.deepEqual(map.serviceChecks.map(x=>x.id).sort(),services.services.map(x=>x.id).sort());
 assert.equal(map.counts.editorialGuides,guides.guides.length);
 assert.ok(batches.length>=33);
 assert.ok(batches.every(x=>x.editoriallyApproved!==true));
 for(const a of map.actChecks){
  assert.equal(a.currentConsolidatedEditionVerified,false);
  assert.equal(a.allAmendmentsVerified,false);
  assert.equal(a.allAnnexesVerified,false);
  assert.equal(a.publicationApproved,false);
 }
 for(const a of map.serviceChecks) {
  for(const key of ["applicantTypesVerified","latestRegulationVerified","exhaustiveDocumentsVerified",
       "filingChannelVerified","exactDeadlineVerified","groundsForRefusalVerified",
       "appealVerified","publicationApproved"]) assert.equal(a[key],false,`unsupported approval: ${a.id} ${key}`);
 }
 for(const a of map.missingOrIncompleteTopics){
  assert.ok(["P0","P1","P2"].includes(a.priority));
  assert.equal(a.legalSignoff,false);
  assert.equal(a.publicationApproved,false);
  assert.ok(a.nextStep.length>65);
  assert.equal(new URL(a.officialLead).protocol,"https:");
 }
});
test("separate primary-source amendment evidence is not declared a complete current regulation",()=>{
 assert.equal(map.officialEvidence.length,6);
 const docs=Object.fromEntries(map.officialEvidence.map(x=>[x.id,x]));
 assert.match(docs["820-pp-2026"].act,/820-ПП/);
 assert.equal(docs["820-pp-2026"].effectiveFrom,"2026-04-15");
 assert.ok(docs["820-pp-2026"].appliesTo.some(x=>x.includes("приложение 6")));
 assert.ok(docs["1095-pp-2023"].appliesTo.some(x=>x.includes("1285-ПП")));
 assert.ok(docs["692-pp-historical-text"].appliesTo.some(x=>x.includes("692-ПП")));
 assert.ok(docs["759-pp-2026-communal"].appliesTo.some(x=>x.includes("1285-ПП")));
 assert.ok(docs["132-pp-2019-primary-and-2895-pp-2022-amendment"].appliesTo.includes("521-ПП"));
 assert.ok(docs["519-pp-2017-exchange-regulation"].appliesTo[0].includes("519-ПП"));
 for(const s of map.officialEvidence){
  assert.equal(s.currentConsolidatedEditionVerified,false);
  assert.equal(s.publicationApproved,false);
  assert.ok(s.notConfirmed.length>=2);
  assert.ok(["vestnikmoscow.mos.ru","www.mos.ru"].includes(new URL(s.url).hostname));
 }
 const service=services.services.find(x=>x.id==="housing-needs-registration");
 const ev=service.verifiedAmendmentEvidence;
 assert.equal(ev.confirmedEffectiveFrom,"2026-04-15");
 assert.equal(ev.approved,false);
 assert.equal(ev.publishedSource,docs["820-pp-2026"].url);
 assert.equal(service.currentRevisionVerified,false);
 assert.equal(service.procedureVerified,false);
 assert.equal(service.publicationApproved,false);
});
test("UI visibly separates verified change from pending consolidated regulation",()=>{
 const component=readFileSync(new URL("../../apps/web/src/components/DgiServiceRegistry.tsx",import.meta.url),"utf8");
 assert.match(component,/Что подтверждено официальной публикацией/);
 assert.match(component,/Действующая редакция и регламент не подтверждены/);
 assert.match(component,/verifiedAmendmentEvidence\.caveat/);
 assert.match(component,/Официальная публикация изменений/);
});
