// Import only sanitized metadata from a pinned Webflow CMS inventory.
// Documents are PRIVATE and NEVER promoted to the public website.
import {readFileSync} from "node:fs";
type Item={id:string;slug:string;status:string;verified:boolean;title:string;metadata:Record<string,unknown>};
type Archive={siteId:string;collections:Array<{slug:string;items:Item[]}>};
const file=new URL("../../../../migration/cms-inventory.json",import.meta.url);
const archive=JSON.parse(readFileSync(file,"utf8")) as Archive;
const allowed=["dgi-court-cases","dgi-legal-documents","dgi-legal-situations","housing-law-news"];
if(archive.siteId!=="6aca6bde03aad0f2e3c19259" || archive.collections.length!==4)
  throw new Error("Unexpected source site or number of collections");
const keys=new Set<string>();
const rows:Array<{sourceKey:string;sourceCollection:string;sourceItemId:string;
  sourceSlug:string;title:string;legacyStatus:string;sourceMetadata:Record<string,unknown>}>=[];
for(const collection of archive.collections) {
  if(!allowed.includes(collection.slug))throw new Error("Unexpected collection");
  for(const item of collection.items) {
    const key=`${collection.slug}:${item.id}`;
    if(keys.has(key)||!/^[a-f\d]{24}$/.test(item.id)||
      !/^[a-z0-9-]+$/.test(item.slug)||
      !["draft","legacy_public_unverified"].includes(item.status)||
      item.verified!==false || !item.title?.trim() ||
      !item.metadata || typeof item.metadata!=="object" || Array.isArray(item.metadata))
      throw new Error("Invalid sanitized CMS record");
    keys.add(key);
    rows.push({
      sourceKey:key,sourceCollection:collection.slug,sourceItemId:item.id,
      sourceSlug:item.slug,title:item.title,legacyStatus:item.status,
      sourceMetadata:item.metadata,
    });
  }
}
if(rows.length!==50)throw new Error(`Expected 50 CMS source records; got ${rows.length}`);
const mode=process.argv[2]||"--dry-run";
if(!["--dry-run","--apply"].includes(mode)||process.argv.length>3)
  throw new Error("Usage: --dry-run or --apply");
if(mode==="--dry-run"){
  console.log(JSON.stringify({mode,records:rows.length,publications:0,writes:0}));
  process.exit(0);
}
if(process.env.CMS_PRIVATE_IMPORT!=="yes"||process.env.CMS_IMPORT_CONFIRM!=="yes"||
  !process.env.CMS_DATABASE_URL || !process.env.PAYLOAD_SECRET ||
  process.env.PAYLOAD_SECRET.length<32)
  throw new Error("Requires explicit private CMS import and strong secret");
const [{getPayload},{default:config}]=await Promise.all([
  import("payload"),import("../payload.config")
]);
const payload=await getPayload({config});
let created=0,skipped=0;
for(const row of rows){
  const present=await payload.find({collection:"webflow-cms-review",
    where:{sourceKey:{equals:row.sourceKey}},overrideAccess:true,depth:0,limit:1});
  if(present.totalDocs){skipped++;continue;}
  await payload.create({collection:"webflow-cms-review",overrideAccess:true,
    data:{
      ...row,
      sourceCollection:row.sourceCollection as
        "dgi-court-cases" | "dgi-legal-documents" | "dgi-legal-situations" | "housing-law-news",
      legacyStatus:row.legacyStatus as "draft" | "legacy_public_unverified",
      sourceMetadata:JSON.parse(JSON.stringify(row.sourceMetadata)),
      reconciliationStatus:"pending",
    }});
  created++;
}
console.log(JSON.stringify({mode:"private-metadata-only",total:rows.length,created,skipped,publications:0}));
process.exit(0);
