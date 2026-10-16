// Controlled idempotent import of guides, law references, DGI services as private drafts.
import {buildExtraDgiDrafts} from "../../../../scripts/lib/build-extra-dgi-drafts.mjs";
const rows=buildExtraDgiDrafts();
const mode=process.argv[2]??"--dry-run";
if(!["--dry-run","--apply"].includes(mode)||process.argv.length>3)
 throw Error("Usage: import-extra-dgi-drafts.ts --dry-run|--apply");
if(mode==="--dry-run"){
 console.log(JSON.stringify({mode,count:rows.length,publications:0,verified:0,writes:0}));
 process.exit(0);
}
if(process.env.CMS_PRIVATE_IMPORT!=="yes"||process.env.CMS_IMPORT_CONFIRM!=="yes"||
 !process.env.CMS_DATABASE_URL || !process.env.PAYLOAD_SECRET ||
 process.env.PAYLOAD_SECRET.length<32)throw Error("Dedicated private CMS credentials and explicit write confirmation required");
const [{getPayload},{default:config}]=await Promise.all([import("payload"),import("../payload.config")]);
const payload=await getPayload({config});
let created=0,skipped=0;
for(const row of rows){
 const exists=await payload.find({collection:"editorial-entries",
  where:{slug:{equals:row.slug}},limit:1,depth:0,overrideAccess:true});
 if(exists.totalDocs){skipped++;continue;}
 await payload.create({collection:"editorial-entries",
  overrideAccess:true,context:{migrationSource:"dgi-curated-drafts"},
  data:{...row,reviewState:"needs-review",_status:"draft"}});
 created++;
}
console.log(JSON.stringify({mode:"private-drafts-only",count:rows.length,created,skipped,approved:0,published:0}));
process.exit(0);
