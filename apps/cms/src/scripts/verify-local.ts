// Never verify or read an arbitrary remote CMS. Local offline acceptance only.
import {getPayload} from "payload";
import config from "../payload.config";
const db=process.env.CMS_DATABASE_URL;
let url:URL;
try {url=new URL(db||"");}catch {throw Error("Missing local CMS_DATABASE_URL");}
if(process.env.LOCAL_VERIFY_CONFIRM!=="yes"||
   process.env.SITE_CUTOVER!=="false"||
   url.protocol!=="postgresql:"||url.hostname!=="127.0.0.1"||
   url.port!=="5435"||url.pathname!=="/housing_cms"||
   process.env.NODE_ENV==="production")
  throw Error("Refusing any CMS other than explicitly confirmed local 127.0.0.1:5435/housing_cms");
const cms=await getPayload({config});
const admin=await cms.count({collection:"staff-users",overrideAccess:true});
const pages=await cms.find({collection:"editorial-entries",overrideAccess:true,draft:true,limit:100,depth:0});
const metadata=await cms.find({collection:"webflow-cms-review",overrideAccess:true,limit:100,depth:0});
const originals=await cms.find({collection:"webflow-private-sources",overrideAccess:true,limit:100,depth:0});
if(admin.totalDocs<1)throw Error("No administrator: run offline bootstrap");
if(pages.totalDocs!==33)throw Error("Expected 33 Webflow page drafts");
if(metadata.totalDocs!==50)throw Error("Expected 50 CMS metadata records");
if(!pages.docs.every(p=>p._status==="draft"&&p.reviewState==="needs-review"&&!p.reviewedAt&&!p.reviewedBy))
  throw Error("The imported pages are not all untouched drafts");
if(!metadata.docs.every(p=>p.reconciliationStatus==="pending"))
  throw Error("Metadata reconciliation must start pending");
if(originals.totalDocs!==0&&originals.totalDocs!==50)
  throw Error("Full source is only partially imported; investigate");
if(process.env.LOCAL_REQUIRE_FULL_SOURCE==="yes"&&originals.totalDocs!==50)
  throw Error("Full Webflow original content is missing from local Payload");
const keys=new Set(originals.docs.map(p=>p.sourceKey));
if(keys.size!==originals.totalDocs||
   originals.docs.some(p=>!p.sourceDigest||!p.sourceSlug||!p.sourceItemId))
  throw Error("Invalid/duplicate imported source metadata");
console.log(JSON.stringify({
  administrators:admin.totalDocs,pageDrafts:pages.totalDocs,
  cmsMetadata:metadata.totalDocs,fullPrivateOriginals:originals.totalDocs,
  approvedByThisCheck:0,publishedByThisCheck:0
}));
process.exit(0);
