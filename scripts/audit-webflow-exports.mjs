#!/usr/bin/env node
// Offline-only quality audit of PRIVATE Webflow API exports.
// Never prints raw fields or marks a judicial decision as verified.
import {readFileSync,mkdirSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";

const root=resolve(fileURLToPath(new URL("..",import.meta.url)));
export function classifyCourtUrl(input){
  if(input===null||input===undefined||input==="")return {kind:"missing",domain:null};
  if(typeof input!=="string")return {kind:"invalid",domain:null};
  try {
    const url=new URL(input);
    if(url.protocol!=="https:"||url.username||url.password)return {kind:"invalid",domain:null};
    const host=url.hostname.toLowerCase();
    if(host==="mos-gorsud.ru"||host==="www.mos-gorsud.ru"||
       host==="sudrf.ru"||host.endsWith(".sudrf.ru"))
      return {kind:"official_domain_candidate",domain:host};
    if(host==="sudact.ru"||host==="www.sudact.ru")
      return {kind:"secondary_aggregator",domain:host};
    return {kind:"other_requires_review",domain:host};
  }catch {return {kind:"invalid",domain:null};}
}
export function auditRawExports(inventory,readCollection){
  if(inventory.siteId!=="6aca6bde03aad0f2e3c19259"||
      inventory.collections.length!==4)throw Error("Unknown source inventory");
  const cases=[];
  const collections=[];
  const visited=new Set();
  const counts={
    "dgi-court-cases":37,"dgi-legal-documents":4,
    "dgi-legal-situations":6,"housing-law-news":3,
  };
  for(const collection of inventory.collections){
    const {slug,sourceCollectionId,items:pinned}=collection;
    if(!(slug in counts)||visited.has(slug)||pinned.length!==counts[slug]||
        !/^[0-9a-f]{24}$/.test(sourceCollectionId))
      throw Error("Unexpected collection or source count");
    visited.add(slug);
    const originals=readCollection(sourceCollectionId);
    if(!Array.isArray(originals)||originals.length!==pinned.length)
      throw Error("Webflow source collection does not match the pinned inventory");
    const sourceById=new Map();
    for(const row of originals){
      if(!row||typeof row.id!=="string"||sourceById.has(row.id))
        throw Error("Missing or duplicate Webflow ID");
      sourceById.set(row.id,row);
    }
    for(const expected of pinned){
      const original=sourceById.get(expected.id);
      if(!original||!original.fieldData||
         original.fieldData.slug!==expected.slug||
         typeof original.fieldData.name!=="string"||
         !original.fieldData.name.trim()||
         typeof original.isDraft!=="boolean"||
         (original.isDraft?"draft":"legacy_public_unverified")!==expected.status)
        throw Error("Pinned source identity, slug or publication status changed");
      if(slug==="dgi-court-cases"){
        const f=original.fieldData;
        const official=classifyCourtUrl(f["oficialnyy-istochnik"]);
        const publication=classifyCourtUrl(f["publikaciya-sudebnogo-akta"]);
        cases.push({
          slug:expected.slug,
          officialSourceKind:official.kind,
          officialSourceDomain:official.domain,
          officialCandidateUrl:official.kind==="official_domain_candidate" ? f["oficialnyy-istochnik"] : null,
          secondarySourceKind:publication.kind,
          secondarySourceDomain:publication.domain,
          secondaryReferenceUrl:publication.kind==="secondary_aggregator" ? f["publikaciya-sudebnogo-akta"] : null,
          judgmentVerified:false,
          outcomeVerified:false,
          appellateHistoryVerified:false,
          status:"pending_manual_primary_act_review",
        });
      }
    }
    collections.push({slug,count:originals.length,identityMatch:true});
  }
  if(cases.length!==37||collections.reduce((s,c)=>s+c.count,0)!==50)
    throw Error("Expected 50 records, including 37 court cases");
  const countKind=(field,kind)=>cases.filter(row=>row[field]===kind).length;
  const summary={
    sourceRecords:50,sourceCollections:collections,
    courtCases:37,
    officialDomainCandidates:countKind("officialSourceKind","official_domain_candidate"),
    missingOfficialSource:countKind("officialSourceKind","missing"),
    otherOfficialFieldReview:cases.filter(row=>
      !["official_domain_candidate","missing"].includes(row.officialSourceKind)).length,
    secondaryAggregatorReferences:countKind("secondarySourceKind","secondary_aggregator"),
    judicialActsVerified:0,
    approvedForPublication:0,
  };
  return {summary,cases};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const inventory=JSON.parse(readFileSync(resolve(root,"migration/cms-inventory.json"),"utf8"));
  const report=auditRawExports(inventory,id=>JSON.parse(readFileSync(
    resolve(root,".migration/webflow/cms-"+id+".json"),"utf8")));
  const folder=resolve(root,".migration/reports");
  mkdirSync(folder,{recursive:true,mode:0o700});
  const output=resolve(folder,"court-source-review.json");
  writeFileSync(output,JSON.stringify({generatedAt:new Date().toISOString(),...report},null,2),{mode:0o600});
  console.log(JSON.stringify({
    ...report.summary,
    privateReport:".migration/reports/court-source-review.json",
    note:"A court-domain URL is only a source candidate, NOT a verified judgment."
  },null,2));
}
