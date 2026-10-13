// Manual private-only import from gitignored Webflow API exports.
import {readFileSync} from "node:fs";
import {resolve,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {WEBFLOW_PRIVATE_FIELDS,selectPrivateSource} from "../lib/private-webflow-content";
type Pinned={id:string;slug:string;status:"draft"|"legacy_public_unverified";verified:false};
type Inventory={siteId:string;collections:Array<{slug:string;sourceCollectionId:string;items:Pinned[]}>};
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../../../..");
const mode=process.argv[2]||"--dry-run";
if(!["--dry-run","--apply"].includes(mode)||process.argv.length!==3)
  throw Error("Specify --dry-run or --apply");
const archive=JSON.parse(readFileSync(resolve(root,"migration/cms-inventory.json"),"utf8")) as Inventory;
const counts:Record<string,number>={"dgi-court-cases":37,"dgi-legal-documents":4,
"dgi-legal-situations":6,"housing-law-news":3};
if(archive.siteId!=="6aca6bde03aad0f2e3c19259"||archive.collections.length!==4)
  throw Error("Unexpected pinned inventory");
const rows=[];const seen=new Set<string>();
for(const c of archive.collections){
  const schema=WEBFLOW_PRIVATE_FIELDS[c.slug];
  if(!schema||schema.id!==c.sourceCollectionId||c.items.length!==counts[c.slug]||seen.has(c.slug))
    throw Error("Collection mismatch");
  seen.add(c.slug);
  const source=JSON.parse(readFileSync(resolve(root,
    ".migration/webflow/cms-"+schema.id+".json"),"utf8")) as Array<{
      id?:unknown;isDraft?:unknown;fieldData?:unknown;lastUpdated?:unknown}>;
  if(!Array.isArray(source)||source.length!==c.items.length)
    throw Error("Source inventory count mismatch");
  const byId=new Map<string,(typeof source)[number]>();
  for(const item of source){
    if(typeof item.id!=="string"||byId.has(item.id))throw Error("Invalid/duplicate item ID");
    byId.set(item.id,item);
  }
  for(const pinned of c.items){
    const item=byId.get(pinned.id);
    if(!item)throw Error("Pinned item not found");
    rows.push(selectPrivateSource(c.slug,item,pinned));
  }
}
if(rows.length!==50)throw Error("Expected 50 records");
if(mode==="--dry-run"){
  console.log(JSON.stringify({validated:rows.length,writes:0,approvals:0,publications:0}));
  process.exit(0);
}
if(process.env.CMS_PRIVATE_IMPORT!=="yes"||process.env.CMS_IMPORT_CONFIRM!=="yes"||
   process.env.CMS_FULL_CONTENT_CONFIRM!=="yes"||
   process.env.CMS_CONTENT_IMPORT_TARGET!=="staging"||
   !process.env.CMS_DATABASE_URL||!process.env.PAYLOAD_SECRET||
   process.env.PAYLOAD_SECRET.length<32||
   process.env.CMS_DATABASE_URL===process.env.DATABASE_URL)
  throw Error("Only explicitly confirmed isolated staging CMS allowed");
const [{getPayload},{default:config}]=await Promise.all([
  import("payload"),import("../payload.config")]);
const payload=await getPayload({config});
let skipped=0;const toCreate=[];let conflicts=0;
for(const row of rows){
  const found=await payload.find({collection:"webflow-private-sources",
    overrideAccess:true,depth:0,limit:1,
    where:{sourceKey:{equals:row.sourceKey}}});
  if(!found.totalDocs)toCreate.push(row);
  else if(found.docs[0].sourceDigest===row.sourceDigest)skipped++;
  else conflicts++;
}
if(conflicts)throw Error("Source content changed for "+conflicts+" records; no writes");
let created=0;
for(const row of toCreate){
  await payload.create({collection:"webflow-private-sources",overrideAccess:true,
    data:{...row,sourceCollection:row.sourceCollection as
      "dgi-court-cases"|"dgi-legal-documents"|"dgi-legal-situations"|"housing-law-news"}});
  created++;
}
console.log(JSON.stringify({records:rows.length,created,skipped,approvals:0,publications:0}));
process.exit(0);
