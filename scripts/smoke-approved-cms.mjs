import assert from "node:assert/strict";
import pg from "pg";
// Writes only disposable GitHub Actions CI fixtures, never user databases.
const uri=process.env.DATABASE_URL||"";
if(process.env.CI!=="true" || !uri.includes("/housing_ci") ||
   process.env.CMS_PUBLIC_READS!=="true" || process.env.SITE_CUTOVER!=="false")
  throw Error("Refusing CMS smoke outside isolated CI staging");
const db=new pg.Client({connectionString:uri});
await db.connect();
try{
  for(const [slug,status,marker] of [
    ["housing-law-news/ci-approved-example","published","CI approved nested article"],
    ["dgi-legal-documents/ci-unapproved-example","review","CI private content must be hidden"],
  ]){
    const sql="INSERT INTO editorial_pages "+
      "(slug,kind,title,seo_title,seo_description,body,editorial_status,"+
      "checked_at,reviewed_by,published_at) "+
      "VALUES ($1,'news',$3,$3,'CI-only fixture',$4::jsonb,$2,"+
      "CASE WHEN $2='published' THEN now() END,"+
      "CASE WHEN $2='published' THEN 'ci-reviewer' END,"+
      "CASE WHEN $2='published' THEN now() END)";
    await db.query(sql,[slug,status,marker,
      JSON.stringify([{kind:"h1",text:marker},
       {kind:"p",text:"Temporary automated quality-assurance fixture."}])]);
  }
} finally {await db.end();}
const origin=process.env.STAGING_TEST_ORIGIN||"http://127.0.0.1:3000";
const fetchPage=async path=>fetch(new URL(path,origin),{
  redirect:"manual",signal:AbortSignal.timeout(15000),
});
let ready=false;
for(let n=0;n<50;n++){
  try{if((await fetchPage("/api/health")).ok){ready=true;break;}}catch{}
  await new Promise(ok=>setTimeout(ok,500));
}
assert.ok(ready,"Next.js server did not become healthy");
const published=await fetchPage("/housing-law-news/ci-approved-example");
assert.equal(published.status,200,"Approved nested CMS page not rendered");
const html=await published.text();
assert.match(html,/CI approved nested article/);
assert.match(html,/noindex/i,"Staging must remain non-indexable");
const hidden=await fetchPage("/dgi-legal-documents/ci-unapproved-example");
assert.equal(hidden.status,404,"Unapproved CMS article was exposed");
const unknown=await fetchPage("/housing-law-news/not-in-database");
assert.equal(unknown.status,404);
console.log(JSON.stringify({approvedNested:200,unreviewedNested:404,unknown:404,noindex:true}));
