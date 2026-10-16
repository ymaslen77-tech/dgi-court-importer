// Controlled, local/staging-only import of a complete already-public judicial act.
// Input: node scripts/import-official-court-act.mjs ./private-manifest.json [--apply]
// The manifest and text stay outside Git; this script NEVER publishes an act.
import pg from "pg";
import {createHash} from "node:crypto";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const [manifestPath,mode]=process.argv.slice(2);
if(!manifestPath || (mode && mode!=="--apply"))
 throw new Error("Usage: node scripts/import-official-court-act.mjs /secure/manifest.json [--apply]");
const input=JSON.parse(readFileSync(resolve(manifestPath),"utf8"));
const required=["slug","stableKey","caseNumber","courtName","instanceType","decisionDate",
 "actType","topic","officialUrl","fullTextFile","seoTitle","seoDescription","editorNote"];
for(const key of required)if(typeof input[key]!=="string" || !input[key].trim())
 throw new Error("Missing required field: "+key);
const url=new URL(input.officialUrl);
const host=url.hostname.toLowerCase(),accepted=["mos-gorsud.ru","sudrf.ru","vsrf.ru","kad.arbitr.ru"];
if(url.protocol!=="https:" || url.username||url.password||url.port || url.hash ||
 !accepted.some(h=>host===h||host.endsWith("."+h)) ||
 /\/services\/cases\/(appeal-civil|civil|appeal-criminal|criminal|administrative)\/?$/i.test(url.pathname))
 throw new Error("Require a direct official case/act URL; search-list URLs are not evidence");
if(!/^official:[a-zA-Z0-9:_\-.]{1,200}$/.test(input.stableKey) ||
 !/^[a-z0-9][a-z0-9-]{2,159}$/.test(input.slug) ||
 !/^\d{4}-\d{2}-\d{2}$/.test(input.decisionDate) ||
 !["first","appeal","cassation","supervisory","unknown"].includes(input.instanceType) ||
 !["decision","ruling","judgment","order","other"].includes(input.actType))
 throw new Error("Invalid case identifier, date, act kind or slug");
if(input.courtPublicTextConfirmed!==true || input.sensitiveDataReviewedForDraft!==true)
 throw new Error("An editor must confirm an officially published, safe-for-staging copy");
const body=readFileSync(resolve(input.fullTextFile),"utf8").replace(/\r\n?/g,"\n").trim();
if(body.length<400||body.length>2000000)throw new Error("Only a complete, reasonably-sized text is accepted");
if(input.seoTitle.length<20||input.seoDescription.length<60||input.editorNote.length<70)
 throw new Error("Provide useful human-reviewed description and editorial context");
const sha256=createHash("sha256").update(body).digest("hex");
const report={slug:input.slug,source:input.officialUrl,characters:body.length,
 sha256,status:"review",published:false,containsTextInLocalPostgres:true};
if(mode!=="--apply"){console.log(JSON.stringify({...report,dryRun:true},null,2));process.exit(0);}
if(process.env.COURT_IMPORT_ALLOW_WRITE!=="staging" || !process.env.DATABASE_URL ||
 process.env.SITE_CUTOVER==="true")
 throw new Error("Refusing import outside explicitly authorized staging database");
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
await db.connect();
try{
 await db.query("BEGIN");
 const {rows}=await db.query(`
  SELECT cc.id AS case_id,ci.id AS instance_id
  FROM court_cases cc JOIN court_instances ci ON ci.case_id=cc.id
  WHERE cc.stable_key=$1 AND ci.case_number=$2 AND ci.court_name=$3
  LIMIT 2`,[input.stableKey,input.caseNumber,input.courtName]);
 if(rows.length!==1)throw new Error("The supplied exact case number and court do not uniquely match staging metadata");
 const params=[input.slug,rows[0].case_id,rows[0].instance_id,input.caseNumber,input.uid||null,
  input.courtName,input.instanceType,input.decisionDate,input.actType,input.topic,body,
  input.officialUrl,input.seoTitle,input.seoDescription,input.editorNote];
 await db.query(`
  INSERT INTO court_act_documents
   (slug,case_id,instance_id,case_number,uid,court_name,instance_type,decision_date,act_type,
    topic,full_text,official_url,seo_title,seo_description,editor_note,status)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,'review')
  ON CONFLICT(slug) DO UPDATE SET
   case_id=excluded.case_id,instance_id=excluded.instance_id,
   case_number=excluded.case_number,uid=excluded.uid,court_name=excluded.court_name,
   instance_type=excluded.instance_type,decision_date=excluded.decision_date,
   act_type=excluded.act_type,topic=excluded.topic,full_text=excluded.full_text,
   official_url=excluded.official_url,seo_title=excluded.seo_title,
   seo_description=excluded.seo_description,editor_note=excluded.editor_note,
   status='review',source_checked_at=NULL,text_verified_at=NULL,
   privacy_checked_at=NULL,reviewed_by=NULL,published_at=NULL`,params);
 await db.query("COMMIT");
 console.log(JSON.stringify({...report,applied:true,requiresManualLegalApproval:true},null,2));
}catch(error){await db.query("ROLLBACK");throw error;}finally{await db.end();}
