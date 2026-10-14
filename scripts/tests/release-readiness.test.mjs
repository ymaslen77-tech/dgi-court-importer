import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {auditRelease} from "../release-readiness.mjs";
const fixture=(relative)=>JSON.parse(readFileSync(new URL(relative,import.meta.url),"utf8"));
test("release audit reports court, CMS and media blockers",()=>{
  const report=auditRelease({
    seo:fixture("../../migration/webflow-seo-manifest.json"),
    cms:fixture("../../migration/cms-inventory.json"),
    courts:fixture("../../apps/web/src/data/legacy-cases.json"),
    media:fixture("../../migration/webflow-external-media.json"),
  });
  assert.equal(report.releaseReady,false);
  assert.equal(report.staticPages,33);
  assert.equal(report.cmsRecords,50);
  assert.equal(report.unverifiedCmsRecords,50);
  assert.equal(report.unverifiedLegacyCourtCards,22);
  assert.equal(report.externalImagesPendingRights,5);
  assert.ok(report.blockers.some(v=>v.key==="cms_legal_review"));
  assert.ok(report.blockers.some(v=>v.key==="external_media_rights"));
  assert.equal(report.manualChecks.stagingDeployment,"not_verified");
});
