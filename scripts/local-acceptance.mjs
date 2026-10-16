#!/usr/bin/env node
// Local QA register; generates pending-only evidence/checklist, no automatic sign-off.
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
const load=(p)=>JSON.parse(readFileSync(resolve(root,p),"utf8"));
export function buildLocalQaMatrix(seo,cms,legacy){
  if(seo.pages?.length!==33||legacy.cases?.length!==22||
     cms.collections?.flatMap(c=>c.items).length!==50)
    throw Error("Pinned Webflow inventory count changed");
  const paths=seo.pages.map(p=>p.path);
  if(new Set(paths).size!==33||!paths.includes("/"))
    throw Error("Static URLs are duplicated or incomplete");
  const staticPages=seo.pages.map(p=>({
    path:p.path,sourceUrl:"https://dgimos.webflow.io"+p.path,
    seoTitle:p.seoTitle,seoDescription:p.seoDescription,
    desktopManualReview:"pending",mobileManualReview:"pending",
    interactiveElements:"pending",legalReview:"pending",
    imageRights:"pending",canonicalAtCutover:"requires_production_host"
  }));
  const archives=legacy.cases.map(c=>({
    path:"/dgi-court-cases/"+c.slug,
    primaryJudgmentReview:"pending",appealHistoryReview:"pending",indexingAllowed:false
  }));
  if(new Set(archives.map(c=>c.path)).size!==22 ||
    archives.some(c=>paths.includes(c.path)))throw Error("Court archive URL collision");
  const cmsReview=cms.collections.flatMap(c=>c.items.map(i=>({
    sourceCollection:c.slug,slug:i.slug,status:"pending_editorial_review",approved:false
  })));
  return {
    counts:{staticPages:33,formerPublicCourtArchives:22,sourceCmsRecords:50},
    staticPages,courtArchives:archives,cmsReview,productionReady:false,
    externalGates:["persistent_staging","full_private_import","legal_source_signoff",
      "media_rights","visual_approval","seo_approval","backup_restore",
      "production_cutover_and_rollback"]
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=buildLocalQaMatrix(
    load("migration/webflow-seo-manifest.json"),
    load("migration/cms-inventory.json"),
    load("apps/web/src/data/legacy-cases.json")
  );
  const folder=resolve(root,".migration/reports");
  mkdirSync(folder,{recursive:true,mode:0o700});
  writeFileSync(resolve(folder,"local-acceptance.json"),JSON.stringify(report,null,2),{mode:0o600});
  const lines=["# Local DGI migration acceptance register","",
    "Pending-only checklist. A green automated test is not a design or legal approval.","",
    "| Original route | Desktop | Mobile | Interactive | Legal | Image rights |",
    "|---|---|---|---|---|---|",
    ...report.staticPages.map(p=>"| "+p.path+" | Pending | Pending | Pending | Pending | Pending |"),
    "","All 50 CMS items remain unapproved. Server, legal and media gates remain outstanding."];
  writeFileSync(resolve(folder,"local-acceptance.md"),lines.join("\n")+"\n",{mode:0o600});
  console.log(JSON.stringify({
    ...report.counts,manualVisualReviews:33,manualCmsReviews:50,productionApproved:false,
    privateOutput:".migration/reports/local-acceptance.md"
  },null,2));
}
