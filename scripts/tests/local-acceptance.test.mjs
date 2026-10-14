import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildLocalQaMatrix} from "../local-acceptance.mjs";
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),"utf8"));
test("local quality register covers every preserved public URL and CMS record",()=>{
 const report=buildLocalQaMatrix(
  load("../../migration/webflow-seo-manifest.json"),
  load("../../migration/cms-inventory.json"),
  load("../../apps/web/src/data/legacy-cases.json")
 );
 assert.deepEqual(report.counts,{staticPages:33,formerPublicCourtArchives:22,sourceCmsRecords:50});
 assert.equal(report.staticPages.length,33);
 assert.equal(report.courtArchives.length,22);
 assert.equal(report.cmsReview.length,50);
 assert.equal(report.productionReady,false);
 assert.ok(report.cmsReview.every(x=>x.approved===false));
 assert.ok(report.courtArchives.every(x=>x.indexingAllowed===false));
 assert.ok(report.staticPages.every(x=>x.desktopManualReview==="pending"&&x.imageRights==="pending"));
});
test("missing source URLs reject an incomplete acceptance matrix",()=>{
 const seo=load("../../migration/webflow-seo-manifest.json");
 seo.pages.pop();
 assert.throws(()=>buildLocalQaMatrix(seo,load("../../migration/cms-inventory.json"),
 load("../../apps/web/src/data/legacy-cases.json")),/count changed/);
});
