#!/usr/bin/env node
// Public, sanitized source metadata only. This is NOT an operational sign-off.
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
function load(path) { return JSON.parse(readFileSync(new URL(path,import.meta.url),"utf8")); }
export function auditRelease({seo,cms,courts,media}) {
  const collections=Object.fromEntries(cms.collections.map(c=>[c.slug,c.items.length]));
  const items=cms.collections.flatMap(c=>c.items);
  const unverified=items.filter(item=>item.verified!==true);
  const courtRecords=cms.collections.find(c=>c.slug==="dgi-court-cases")?.items||[];
  const missingOfficialLinks=courtRecords.filter(item=>!item.metadata?.officialCaseUrl).length;
  const unverifiedCases=courts.cases.filter(c=>c.verifiedAct!==true);
  const missingRights=media.media.filter(m=>m.rights!=="verified"||m.copyApproved!==true);
  const blockers=[
    ...(unverified.length?[{key:"cms_legal_review",count:unverified.length}]:[]),
    ...(unverifiedCases.length?[{key:"legacy_court_act_review",count:unverifiedCases.length}]:[]),
    ...(missingOfficialLinks?[{key:"court_primary_link_missing",count:missingOfficialLinks}]:[]),
    ...(missingRights.length?[{key:"external_media_rights",count:missingRights.length}]:[]),
  ];
  const consistent=seo.pages.length===33 && items.length===50 &&
    courts.cases.length===22 && media.media.length===5 &&
    collections["dgi-court-cases"]===37 &&
    collections["dgi-legal-documents"]===4 &&
    collections["dgi-legal-situations"]===6 &&
    collections["housing-law-news"]===3 &&
    new Set(items.map(x=>x.id)).size===items.length;
  if(!consistent)throw Error("Pinned source inventory drift; review source data");
  return {
    releaseReady:false,
    staticPages:seo.pages.length,
    cmsRecords:items.length,
    cmsByCollection:collections,
    unverifiedCmsRecords:unverified.length,
    unverifiedLegacyCourtCards:unverifiedCases.length,
    courtCardsMissingOfficialLink:missingOfficialLinks,
    externalImagesPendingRights:missingRights.length,
    manualChecks:{
      fullContentImported:"not_verified",
      stagingDeployment:"not_verified",
      legalSignoff:"not_verified",
      seoSignoff:"not_verified",
      visualAndMobileSignoff:"not_verified",
      securityAndBackups:"not_verified",
    },
    blockers,
  };
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=auditRelease({
    seo:load("../migration/webflow-seo-manifest.json"),
    cms:load("../migration/cms-inventory.json"),
    courts:load("../apps/web/src/data/legacy-cases.json"),
    media:load("../migration/webflow-external-media.json"),
  });
  console.log(JSON.stringify(report,null,2));
  if(process.argv.includes("--require-ready"))process.exitCode=1;
}
