import {test} from "node:test";
import assert from "node:assert/strict";
import {classifyCourtUrl,auditRawExports} from "../audit-webflow-exports.mjs";
test("primary court domains differ from the secondary Sudact aggregator",()=>{
  assert.equal(classifyCourtUrl("https://2kas.sudrf.ru/modules.php?name=sud_delo").kind,"official_domain_candidate");
  assert.equal(classifyCourtUrl("https://www.mos-gorsud.ru/mgs/services/cases").kind,"official_domain_candidate");
  assert.equal(classifyCourtUrl("https://sudact.ru/regular/doc/123").kind,"secondary_aggregator");
  assert.equal(classifyCourtUrl("https://sudact.ru.evil.invalid/doc").kind,"other_requires_review");
  assert.equal(classifyCourtUrl("javascript:alert(1)").kind,"invalid");
  assert.equal(classifyCourtUrl("http://2kas.sudrf.ru/doc").kind,"invalid");
  assert.equal(classifyCourtUrl(null).kind,"missing");
});
const lengths=[["dgi-court-cases",37],["dgi-legal-documents",4],
 ["dgi-legal-situations",6],["housing-law-news",3]];
function fixture(){
  const sources=new Map();
  const collections=lengths.map(([slug,count],c)=>{
    const id=String(c+10).padStart(24,"0");
    const records=Array.from({length:count},(_,i)=>{
      const rowId=String(c*100+i+1).padStart(24,"0");
      const fieldData={slug:slug+"-"+i,name:"Example "+i};
      if(c===0){
        if(i<9)fieldData["oficialnyy-istochnik"]="https://2kas.sudrf.ru/case/"+i;
        if(i>=8)fieldData["publikaciya-sudebnogo-akta"]="https://sudact.ru/regular/doc/"+i;
      }
      return {id:rowId,isDraft:true,fieldData};
    });
    sources.set(id,records);
    return {slug,sourceCollectionId:id,items:records.map(x=>({
      id:x.id,slug:x.fieldData.slug,status:"draft",verified:false
    }))};
  });
  return {inventory:{siteId:"6aca6bde03aad0f2e3c19259",collections},sources};
}
test("all 50 source identities match and court links remain unverified",()=>{
  const {inventory,sources}=fixture();
  const report=auditRawExports(inventory,id=>sources.get(id));
  assert.equal(report.summary.sourceRecords,50);
  assert.equal(report.summary.courtCases,37);
  assert.equal(report.summary.officialDomainCandidates,9);
  assert.equal(report.summary.missingOfficialSource,28);
  assert.equal(report.summary.secondaryAggregatorReferences,29);
  assert.equal(report.summary.judicialActsVerified,0);
  assert.ok(report.cases.every(x=>x.judgmentVerified===false));
});
test("source drift blocks the private audit",()=>{
  const {inventory,sources}=fixture();
  sources.get(inventory.collections[0].sourceCollectionId)[0].fieldData.slug="changed";
  assert.throws(()=>auditRawExports(inventory,id=>sources.get(id)),/identity/);
});
