import assert from "node:assert/strict";
import pg from "pg";
// Executes only in disposable GitHub Actions DB after 0004 schema migration.
if (process.env.DATABASE_URL?.includes("housing_ci")) {
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
await client.connect();
try {
  const indexes=await client.query(`SELECT indexname FROM pg_indexes WHERE schemaname='public'`);
  const names=new Set(indexes.rows.map(r=>r.indexname));
  for(const name of ["court_instances_case_number_trgm_idx","court_instances_court_name_trgm_idx",
    "court_cases_topic_trgm_idx","court_cases_topic_fts_idx","court_instances_court_fts_idx"])
    assert.ok(names.has(name),`Missing search index: ${name}`);
  const count=await client.query(`SELECT COUNT(*)::int AS total FROM court_instances`);
  assert.ok(count.rows[0].total>=38);
  const first=await client.query(`
    SELECT cc.stable_key,ci.id,ci.case_number FROM court_cases cc
    JOIN court_instances ci ON ci.case_id=cc.id
    ORDER BY cc.stable_key,ci.id LIMIT 5
  `);
  assert.equal(first.rows.length,5);
  const last=first.rows.at(-1);
  const next=await client.query(`
    SELECT cc.stable_key,ci.id FROM court_cases cc
    JOIN court_instances ci ON ci.case_id=cc.id
    WHERE cc.stable_key > $1 OR (cc.stable_key=$1 AND ci.id>$2::uuid)
    ORDER BY cc.stable_key,ci.id LIMIT 5
  `,[last.stable_key,last.id]);
  assert.equal(next.rows.length,5);
  assert.ok(next.rows.every(r=>!first.rows.some(p=>p.stable_key===r.stable_key&&p.id===r.id)));
  const found=await client.query(`
    SELECT ci.id FROM court_instances ci
    WHERE ci.case_number ILIKE $1 ESCAPE '\\'
  `,["%"+last.case_number.replace(/[\\%_]/g,"\\$&")+"%"]);
  assert.ok(found.rows.length>=1);
  console.log({indexed:true,firstPage:5,nextPage:next.rows.length,lookup:true});
} finally {await client.end();}
} else {
  console.log("Court search DB integration skipped without disposable CI database");
}
