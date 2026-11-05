import pg from "pg";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";

// Only disposable GitHub CI database. Never writes production.
if(!process.env.DATABASE_URL?.includes("housing_ci")) {
 console.log("Court fulltext DB tests skipped outside disposable CI database");
 process.exit(0);
}
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
await db.connect();
try{
 const {rows:columns}=await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='court_act_documents'");
 assert.ok(columns.some(x=>x.column_name==="full_text_sha256"));
 const names=new Set((await db.query("SELECT indexname FROM pg_indexes WHERE tablename='court_act_documents'")).rows.map(x=>x.indexname));
 for(const n of ["court_act_documents_text_fts_idx","court_act_documents_topic_fts_idx","court_act_documents_published_idx"])
   assert.ok(names.has(n),`Missing index ${n}`);
 const available=await db.query(`
  SELECT cc.id AS case_id,ci.id AS instance_id,ci.case_number,ci.court_name
  FROM court_cases cc JOIN court_instances ci ON ci.case_id=cc.id
  WHERE cc.stable_key LIKE 'official:%' ORDER BY cc.stable_key LIMIT 1`);
 assert.equal(available.rows.length,1);
 const c=available.rows[0],text="ТЕСТОВЫЙ ВЫМЫШЛЕННЫЙ ДОКУМЕНТ: ".repeat(18)
  +"Суд проверяет законность отказа по жилищному учёту; эти сведения не являются реальным судебным решением. ".repeat(6);
 const sha=createHash("sha256").update(text).digest("hex");
 await db.query("BEGIN");
 const added=await db.query(`
  INSERT INTO court_act_documents(slug,case_id,instance_id,case_number,court_name,
   instance_type,decision_date,act_type,topic,full_text,official_url,
   seo_title,seo_description,editor_note)
  VALUES ('ci-synthetic-fulltext-court-act',$1,$2,$3,$4,'cassation','2026-01-01',
   'ruling','жилищный учёт',$5,'https://2kas.sudrf.ru/modules.php?name=sud_delo&case_id=123',
   'Тестовый судебный акт — проверка индексирования',
   'Техническая тестовая запись для проверки полного текста, индекса и безопасного допуска.',
   'Это полностью вымышленная техническая запись для одноразовой CI-базы и тестирования сохранения текста; не публикуется.')
  RETURNING id,status,full_text_sha256`,[c.case_id,c.instance_id,c.case_number,c.court_name,text]);
 const id=added.rows[0].id;
 assert.equal(added.rows[0].status,"draft");
 assert.equal(added.rows[0].full_text_sha256,sha);
 const search=await db.query(`
 SELECT slug FROM court_act_documents WHERE
 to_tsvector('russian',full_text) @@ plainto_tsquery('russian','отказа по жилищному учёту')
 `);
 assert.ok(search.rows.some(x=>x.slug==="ci-synthetic-fulltext-court-act"));
 await db.query("SAVEPOINT invalid");
 let rejected=false;
 try {await db.query("UPDATE court_act_documents SET status='published' WHERE id=$1",[id]);}
 catch(e){if(e.code!=="23514")throw e;rejected=true;}
 assert.ok(rejected,"Court act published without privacy/source signoff");
 await db.query("ROLLBACK TO SAVEPOINT invalid");
 await db.query("UPDATE court_act_documents SET claimant_outcome='applicant_granted',outcome_checked_at=now(),outcome_reviewed_by='ci-reviewer',outcome_evidence='ТЕСТОВЫЙ ИСХОД ДЛЯ CI: требования вымышленного заявителя удовлетворены в фиктивном судебном акте, это не реальное дело.' WHERE id=$1",[id]);
 const applied=await db.query(`
 UPDATE court_act_documents SET status='published',reviewed_by='ci-reviewer',
 source_checked_at=now(),text_verified_at=now(),privacy_checked_at=now(),published_at=now()
 WHERE id=$1 RETURNING status`,[id]);
 assert.equal(applied.rows[0].status,"published");
 const revoked=await db.query(`
 UPDATE court_act_documents SET full_text=$2 WHERE id=$1
 RETURNING status,source_checked_at,text_verified_at,privacy_checked_at,published_at,reviewed_by`,
 [id,text+" Изменено."]);
 assert.equal(revoked.rows[0].status,"review");
 for(const key of ["source_checked_at","text_verified_at","privacy_checked_at","published_at","reviewed_by"])
   assert.equal(revoked.rows[0][key],null);
 await db.query("ROLLBACK");
 console.log(JSON.stringify({storedFullText:true,sha256Matches:true,russianFTS:true,
 publicationRequiresPrivacyReview:true,substantiveEditRevokesPublication:true}));
} finally {await db.end();}
