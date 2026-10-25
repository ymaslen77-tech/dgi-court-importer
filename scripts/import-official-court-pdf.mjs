// Import a locally reviewed court-published ORIGINAL PDF into staging only.
// Use: node scripts/import-official-court-pdf.mjs /secure/manifest.json [--apply]
// Does NOT mark the file approved or publish it. Never store private files in Git.
import pg from "pg";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const [file,mode] = process.argv.slice(2);
if (!file || (mode && mode !== "--apply"))
  throw new Error("Usage: node scripts/import-official-court-pdf.mjs /secure/manifest.json [--apply]");
const input=JSON.parse(readFileSync(resolve(file),"utf8"));
const need=["slug","officialPdfUrl","pdfFile"];
for(const key of need)
  if(typeof input[key]!=="string" || !input[key].trim())throw new Error("Missing "+key);
if(input.officialPdfLocatedAndChecked !== true ||
   input.pdfContentPrivacyReviewedForStaging !== true)
  throw new Error("Source provenance and privacy review required even for a draft");
if(!/^[a-z0-9][a-z0-9-]{2,159}$/.test(input.slug))
  throw new Error("Invalid court act slug");
const url=new URL(input.officialPdfUrl);
const allowed=["mos-gorsud.ru","sudrf.ru","vsrf.ru","kad.arbitr.ru"];
if(url.protocol!=="https:" || url.username || url.password ||
   (url.port && url.port!=="443") ||
   !allowed.some(h=>url.hostname===h||url.hostname.endsWith("."+h)))
  throw new Error("Original court PDF must have an official judicial source");
const bytes=readFileSync(resolve(input.pdfFile));
if(bytes.length<300 || bytes.length>15728640 || bytes.subarray(0,5).toString()!=="%PDF-")
  throw new Error("Expected an original PDF (300 B to 15 MiB)");
const sha256=createHash("sha256").update(bytes).digest("hex");
const report={slug:input.slug,pdfBytes:bytes.length,pdfSha256:sha256,
  approved:false, published:false};
if(mode!=="--apply"){
  console.log(JSON.stringify({...report,dryRun:true},null,2));
  process.exit(0);
}
if(process.env.COURT_IMPORT_ALLOW_WRITE!=="staging" ||
  !process.env.DATABASE_URL || process.env.SITE_CUTOVER==="true")
  throw new Error("Staging-only import refused");
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
await db.connect();
try{
  await db.query("BEGIN");
  const {rows}=await db.query(
    "SELECT id,status FROM court_act_documents WHERE slug=$1 FOR UPDATE",[input.slug]);
  if(rows.length!==1 || rows[0].status==="published")
    throw new Error("Draft court act does not exist or has already been published");
  await db.query(`
    INSERT INTO court_act_pdf_assets(court_act_document_id,official_pdf_url,pdf_bytes)
    VALUES ($1,$2,$3)
    ON CONFLICT(court_act_document_id) DO UPDATE SET
      official_pdf_url=EXCLUDED.official_pdf_url,pdf_bytes=EXCLUDED.pdf_bytes,
      source_checked_at=NULL,privacy_checked_at=NULL,approved_by=NULL,approved_at=NULL
  `,[rows[0].id,url.toString(),bytes]);
  await db.query("COMMIT");
  console.log(JSON.stringify({...report,importedToStaging:true,
    requiresIndependentApproval:true},null,2));
}catch(e){await db.query("ROLLBACK");throw e;}finally{await db.end();}
