// Read-only audit of the *dedicated* persistent Payload CMS database.
// Never prints connection strings, unpublished text, passwords, emails or user data.
// Example: CMS_DATABASE_URL=<secret> node scripts/verify-dgi-neon-cms.mjs
import pg from "pg";
if(!process.env.CMS_DATABASE_URL)throw Error("Set private CMS_DATABASE_URL");
const db=new pg.Client({connectionString:process.env.CMS_DATABASE_URL,connectionTimeoutMillis:5000});
await db.connect();
try{
 const {rows}=await db.query(`
 SELECT current_database() AS db,
  (SELECT count(*)::int FROM information_schema.tables
   WHERE table_schema='public' AND table_type='BASE TABLE') AS tables,
  (SELECT count(*)::int FROM editorial_entries) AS drafts,
  (SELECT count(*)::int FROM _editorial_entries_v WHERE latest=true) AS latest_versions,
  (SELECT count(*)::int FROM editorial_entries_blocks) AS content_blocks,
  (SELECT count(*)::int FROM _editorial_entries_v_version_blocks) AS version_blocks,
  (SELECT count(*)::int FROM editorial_entries_source_urls) AS source_urls,
  (SELECT count(*)::int FROM webflow_cms_review) AS private_cms,
  (SELECT count(*)::int FROM court_references) AS court_references,
  (SELECT count(*)::int FROM staff_users) AS admin_accounts,
  (SELECT count(*)::int FROM editorial_entries WHERE _status='published'
   OR review_state='approved' OR reviewed_at IS NOT NULL OR reviewed_by IS NOT NULL) AS unauthorized_approvals,
  (SELECT count(*)::int FROM webflow_cms_review WHERE reconciliation_status!='pending') AS accepted_sources,
  (SELECT count(*)::int FROM court_references WHERE verification!='metadata-only') AS verified_court_acts
 `);
 const data=rows[0],expected={tables:18,drafts:78,latest_versions:78,content_blocks:1682,
  version_blocks:1682,source_urls:103,private_cms:50,court_references:16,
  unauthorized_approvals:0,accepted_sources:0,verified_court_acts:0};
 for(const [key,val] of Object.entries(expected))if(data[key]!==val)
   throw Error(`CMS database integrity mismatch for ${key}: expected ${val}, got ${data[key]}`);
 if(data.db!=="dgi_cms")throw Error("Database is not the isolated DGI CMS");
 console.log(JSON.stringify({ok:true,...data}));
}finally{await db.end();}
