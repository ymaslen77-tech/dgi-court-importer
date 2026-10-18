// Read-only verification of the DGI Neon content database.
// Usage: DATABASE_URL=<secret> node scripts/verify-dgi-neon-inventory.mjs
// No sensitive connection strings or court text are printed.
import pg from "pg";
if (!process.env.DATABASE_URL)throw new Error("DATABASE_URL must be supplied privately");
const db=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:5000});
await db.connect();
try {
 const result=await db.query(`
 SELECT current_database() AS db,
 (SELECT count(*)::int FROM editorial_pages) AS editorial_pages,
 (SELECT count(*)::int FROM court_cases) AS court_cases,
 (SELECT count(*)::int FROM court_instances) AS instances,
 (SELECT count(*)::int FROM court_sources) AS sources,
 (SELECT count(*)::int FROM webflow_cms_staging) AS cms_records,
 (SELECT count(*)::int FROM court_act_documents) AS full_texts,
 (SELECT count(*)::int FROM editorial_pages WHERE editorial_status='published') AS published_pages,
 (SELECT count(*)::int FROM webflow_cms_staging WHERE publication_allowed=true) AS cms_approved,
 (SELECT count(*)::int FROM court_act_documents WHERE status='published') AS court_acts_published`);
 const row=result.rows[0];
 const expected={editorial_pages:78,court_cases:16,instances:16,sources:16,cms_records:50};
 for (const [key,count] of Object.entries(expected))
   if(row[key]!==count)throw new Error(`Data integrity failure: ${key}; expected ${count}, actual ${row[key]}`);
 if (row.published_pages!==0 || row.cms_approved!==0 || row.court_acts_published!==0)
   throw new Error("Unexpected public editorial or court record; investigate before release");
 console.log(JSON.stringify({ok:true,...row},null,2));
}finally{await db.end();}
