#!/usr/bin/env node
// Deterministic gate report. Source inventories are drafts, not legal approval.
// Never infer a production publication from a successful build.
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const read=(p)=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));
export function summarizeEligibility({pages,acts,services,guides,remediation}){
  const approvedPages=pages.filter(x=>x.editoriallyApproved===true);
  const approvedActs=acts.laws.filter(x=>x.currentVersionVerified===true && x.publicationApproved===true);
  const approvedServices=services.services.filter(x=>x.procedureVerified===true && x.currentRevisionVerified===true && x.publicationApproved===true);
  const approvedGuides=guides.guides.filter(x=>x.stage==="approved" && x.publicationApproved===true);
  const warnings=remediation.sourceIdentityWarnings||[];
  const actIds=new Set(remediation.actChecks.map(x=>x.id));
  const serviceIds=new Set(remediation.serviceChecks.map(x=>x.id));
  if(acts.laws.length!==actIds.size || acts.laws.some(x=>!actIds.has(x.id)))
    throw new Error("Act source/reconciliation count drift: manual legal review required");
  if(services.services.length!==serviceIds.size || services.services.some(x=>!serviceIds.has(x.id)))
    throw new Error("Service source/reconciliation count drift: manual legal review required");
  if(warnings.some(x=>x.doNotMerge!==true || x.publicationApproved!==false))
    throw new Error("Same-number official acts are wrongly marked merged/approved");
  const blockers=[
    ...(approvedPages.length!==pages.length?[{type:"unapproved_static_pages",count:pages.length-approvedPages.length}]:[]),
    ...(approvedActs.length!==acts.laws.length?[{type:"unverified_full_current_law_editions",count:acts.laws.length-approvedActs.length}]:[]),
    ...(approvedServices.length!==services.services.length?[{type:"unverified_service_regulations",count:services.services.length-approvedServices.length}]:[]),
    ...(approvedGuides.length!==guides.guides.length?[{type:"unapproved_guides",count:guides.guides.length-approvedGuides.length}]:[]),
    ...(remediation.missingOrIncompleteTopics.length?[{type:"incomplete_topic_inventory",count:remediation.missingOrIncompleteTopics.length}]:[]),
  ];
  return {
    checkedAgainst:"committed_editorial_inventories",
    notAnOnlineOrHumanLegalSignoff:true,
    allContentLegallyApproved:blockers.length===0,
    eligibleDrafts:{staticPages:approvedPages.length,acts:approvedActs.length,services:approvedServices.length,guides:approvedGuides.length},
    totalDrafts:{staticPages:pages.length,acts:acts.laws.length,services:services.services.length,guides:guides.guides.length},
    blockers,identityWarnings:warnings.map(x=>x.code),
    indexationDecision:blockers.length?"BLOCKED_PENDING_VERIFIED_LEGAL_SIGNOFF":"REQUIRES_SEPARATE_PRODUCTION_AND_EDITOR_APPROVAL",
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const pages=Array.from({length:6},(_,i)=>read(`apps/web/src/data/pages-${i}.json`)).flat();
 const summary=summarizeEligibility({
   pages,acts:read("apps/web/src/data/housing-law-catalog.json"),
   services:read("apps/web/src/data/dgi-service-register.json"),
   guides:read("apps/web/src/data/housing-guides.json"),
   remediation:read("migration/housing-legal-remediation-2026-10-18.json"),
 });
 console.log(JSON.stringify(summary,null,2));
 if(process.argv.includes("--require-indexable") && summary.indexationDecision!=="REQUIRES_SEPARATE_PRODUCTION_AND_EDITOR_APPROVAL")
   process.exitCode=1;
}
