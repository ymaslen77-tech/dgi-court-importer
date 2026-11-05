#!/usr/bin/env node
// Deterministic gate report. Source inventories are drafts, not legal approval.
// Never infer a production publication from a successful build.
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {resolve} from "node:path";

const read=(p)=>JSON.parse(readFileSync(new URL("../"+p,import.meta.url),"utf8"));

const existingOwnerRelease=read("apps/web/src/data/owner-released-legacy-pages.json");
const ownerReleasedSlugs=new Set(existingOwnerRelease.approved_existing_slugs);
const legalSourceHosts=new Set(["www.mos.ru","mos.ru","vestnikmoscow.mos.ru","publication.pravo.gov.ru","pravo.gov.ru"]);
function realIsoDate(value) {
 if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
 const date=new Date(value+"T00:00:00Z");
 return Number.isFinite(date.valueOf())&&date.toISOString().slice(0,10)===value;
}
// These fields are *attestations*, not a machine determination that the law is current.
// An editorial boolean alone cannot ever be interpreted as a legally checked source.
export function hasDocumentedLegalSignoff(item) {
 const review=item?.legalSignoff;
 if(!review||review.approved!==true||
    !realIsoDate(review.reviewedOn)||!realIsoDate(review.editionCheckedThrough)||
    review.editionCheckedThrough>review.reviewedOn||
    typeof review.reviewedBy!=="string"||review.reviewedBy.trim().length<3||
    typeof review.reasonedFinding!=="string"||review.reasonedFinding.trim().length<40||
    review.allMaterialAmendmentsChecked!==true||
    review.fullTextAndAnnexesChecked!==true)return false;
 try {
  const url=new URL(review.officialDocumentUrl);
  const path=decodeURIComponent(url.pathname).toLowerCase();
  return url.protocol==="https:"&&!url.username&&!url.password&&!url.port&&!url.hash&&
    legalSourceHosts.has(url.hostname.toLowerCase())&&
    path.length>12&&path!=="/dgi/"&&path!=="/"&&
    (path.includes("/upload/")||path.startsWith("/document/")||
     path.startsWith("/documents/")||path.endsWith(".pdf"));
 }catch{return false;}
}

export function summarizeEligibility({pages,acts,services,guides,remediation}){
  const approvedPages=pages.filter(x=>x.editoriallyApproved===true && hasDocumentedLegalSignoff(x));
  // Site-owner release of an existing public URL differs from certification
  // of all referenced legal acts. Keep draft inventory validation separate.
  const ownerReleasedExistingPages=pages.filter(x=>
    ownerReleasedSlugs.has(x.slug) &&
    typeof x.source==="string" &&
    x.source===new URL(x.slug ? "/"+x.slug : "/", "https://dgimos.webflow.io").toString() &&
    typeof x.seoTitle==="string" && x.seoTitle.trim().length>=20 &&
    typeof x.description==="string" && x.description.trim().length>=60
  );
  const approvedActs=acts.laws.filter(x=>x.currentVersionVerified===true && x.publicationApproved===true && hasDocumentedLegalSignoff(x));
  const approvedServices=services.services.filter(x=>x.procedureVerified===true && x.currentRevisionVerified===true && x.publicationApproved===true && hasDocumentedLegalSignoff(x));
  const approvedGuides=guides.guides.filter(x=>x.stage==="approved" && x.publicationApproved===true && hasDocumentedLegalSignoff(x));
  const warnings=remediation.sourceIdentityWarnings||[];
  const actIds=new Set(remediation.actChecks.map(x=>x.id));
  const serviceIds=new Set(remediation.serviceChecks.map(x=>x.id));
  if(acts.laws.length!==actIds.size || acts.laws.some(x=>!actIds.has(x.id)))
    throw new Error("Act source/reconciliation count drift: manual legal review required");
  if(services.services.length!==serviceIds.size || services.services.some(x=>!serviceIds.has(x.id)))
    throw new Error("Service source/reconciliation count drift: manual legal review required");
  if(warnings.some(x=>x.doNotMerge!==true || x.publicationApproved!==false))
    throw new Error("Same-number official acts are wrongly marked merged/approved");
  const unprovenApprovals=[...pages.filter(x=>x.editoriallyApproved===true),
    ...acts.laws.filter(x=>x.currentVersionVerified===true&&x.publicationApproved===true),
    ...services.services.filter(x=>x.procedureVerified===true&&x.currentRevisionVerified===true&&x.publicationApproved===true),
    ...guides.guides.filter(x=>x.stage==="approved"&&x.publicationApproved===true)]
    .filter(x=>!hasDocumentedLegalSignoff(x));
  const blockers=[
    ...(unprovenApprovals.length?[{type:"boolean_approval_without_legal_evidence",count:unprovenApprovals.length}]:[]),
    ...(approvedPages.length!==pages.length?[{type:"unapproved_static_pages",count:pages.length-approvedPages.length}]:[]),
    ...(approvedActs.length!==acts.laws.length?[{type:"unverified_full_current_law_editions",count:acts.laws.length-approvedActs.length}]:[]),
    ...(approvedServices.length!==services.services.length?[{type:"unverified_service_regulations",count:services.services.length-approvedServices.length}]:[]),
    ...(approvedGuides.length!==guides.guides.length?[{type:"unapproved_guides",count:guides.guides.length-approvedGuides.length}]:[]),
    ...(remediation.missingOrIncompleteTopics.length?[{type:"incomplete_topic_inventory",count:remediation.missingOrIncompleteTopics.length}]:[]),
  ];
  const ownerReleaseCanIndexPublicPages=ownerReleasedExistingPages.length>0 &&
    unprovenApprovals.length===0;
  return {
    checkedAgainst:"committed_editorial_inventories",
    ownerReleasedExistingPublicPages:ownerReleasedExistingPages.length,
    publicSiteIndexingAllowedWithDraftsRestricted:ownerReleaseCanIndexPublicPages,
    fullCorpusLegalSignoffRemainsSeparate:true,
    notAnOnlineOrHumanLegalSignoff:true,
    allContentLegallyApproved:blockers.length===0,
    eligibleDrafts:{staticPages:approvedPages.length,acts:approvedActs.length,services:approvedServices.length,guides:approvedGuides.length},
    totalDrafts:{staticPages:pages.length,acts:acts.laws.length,services:services.services.length,guides:guides.guides.length},
    blockers,identityWarnings:warnings.map(x=>x.code),
    indexationDecision:unprovenApprovals.length
      ? "BLOCKED_PENDING_VERIFIED_LEGAL_SIGNOFF"
      : ownerReleaseCanIndexPublicPages
      ? "PUBLIC_SITE_INDEXATION_ALLOWED_DRAFTS_EXCLUDED"
      : blockers.length
      ? "BLOCKED_PENDING_VERIFIED_LEGAL_SIGNOFF"
      : "REQUIRES_SEPARATE_PRODUCTION_AND_EDITOR_APPROVAL",
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
 if(process.argv.includes("--require-indexable") &&
    !["PUBLIC_SITE_INDEXATION_ALLOWED_DRAFTS_EXCLUDED",
      "REQUIRES_SEPARATE_PRODUCTION_AND_EDITOR_APPROVAL"].includes(summary.indexationDecision))
   process.exitCode=1;
}
