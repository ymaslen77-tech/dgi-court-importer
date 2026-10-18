// Full HTTP SEO integration, ONLY against disposable GitHub Actions housing_ci.
import pg from "pg";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
if(process.env.CI!=="true" || !process.env.DATABASE_URL?.includes("housing_ci") ||
   process.env.COURT_FULLTEXT_PUBLIC_READS!=="true" ||
   process.env.SITE_CUTOVER!=="true" || process.env.SITE_RELEASE_APPROVED!=="yes")
 throw new Error("Refuse fulltext HTTP test outside disposable CI");
const db=new pg.Client({connectionString:process.env.DATABASE_URL});
await db.connect();
const origin="http://127.0.0.1:3002",slug="ci-fulltext-russian-seo-example";
const get=async path=>fetch(new URL(path,origin),{signal:AbortSignal.timeout(15000)});
const wait=async()=>{for(let i=0;i<50;i++){try{if((await get("/api/health")).ok)return;}catch{}await new Promise(r=>setTimeout(r,500));}throw new Error("Local Next.js not ready");};
let inserted=false;
try{
 await wait();
 assert.equal((await get("/sudebnye-akty/"+slug)).status,404);
 const {rows:cases}=await db.query(`
 SELECT cc.id AS case_id, ci.id AS instance_id,ci.case_number,ci.court_name
 FROM court_cases cc JOIN court_instances ci ON ci.case_id=cc.id
 WHERE cc.stable_key LIKE 'official:%' ORDER BY cc.stable_key LIMIT 1`);
 assert.equal(cases.length,1);
 const c=cases[0],phrase="недостаточная обеспеченность жилой площадью";
 const text=["ВЫМЫШЛЕННЫЙ СУДЕБНЫЙ АКТ ДЛЯ CI-ТЕСТИРОВАНИЯ.",
  "Рассмотрена жалоба на отказ в жилищном учете.",
  "Стороны исследовали вопрос: "+phrase+".",
  "Это искусственный тестовый текст, который НЕ относится к действительным судебным решениям.",
  "Тест серверного рендеринга, разметки, поиска по русским фразам и защиты от публикации."
 ].join("\n\n").repeat(4);
 const seoTitle="Синтетическая проверка жилищного спора — судебный акт для CI";
 const seoDescription="Проверка полнотекстового SEO и внутренних URL на отдельно опубликованном синтетическом судебном акте в одноразовой базе CI.";
 const comment="Это синтетический материал для закрытой проверки сайта. Описываются условия жилищного спора только для тестирования и не заявляется факт реального судебного решения.";
 const url="https://2kas.sudrf.ru/modules.php?case_id=18910390&name=sud_delo&case_uid=207aa87d-e20e-49ea-bd58-14f1bc1f49b7";
 await db.query(`
 INSERT INTO court_act_documents(slug,case_id,instance_id,case_number,court_name,
 instance_type,decision_date,act_type,topic,full_text,official_url,
 seo_title,seo_description,editor_note,status,
 source_checked_at,text_verified_at,privacy_checked_at,reviewed_by,published_at)
 VALUES ($1,$2,$3,$4,$5,'cassation','2026-01-01','ruling',
 'жилищный учет',$6,$7,$8,$9,$10,'published',
 now(),now(),now(),'ci-isolated-reviewer',now())`,
 [slug,c.case_id,c.instance_id,c.case_number,c.court_name,text,url,seoTitle,seoDescription,comment]);
 inserted=true;
 const page=await get("/sudebnye-akty/"+slug);
 assert.equal(page.status,200,"Published full text must render over HTTP");
 const html=await page.text();
 assert.ok(html.includes(phrase),"Act full-text phrase missing from server HTML");
 assert.ok(html.includes(seoTitle),"SEO title missing");
 assert.ok(html.includes('rel="canonical"'));
 assert.ok(html.includes('https://example.org/sudebnye-akty/'+slug),"Canonical must refer to our own domain");
 assert.ok(html.includes("application/ld+json"),"Court structured data missing");
 assert.ok(html.includes("Полный текст судебного акта"));
 assert.ok(html.includes("2kas.sudrf.ru"),"Original official provenance missing");
 assert.ok(!/<meta name="robots" content="noindex/.test(html),"Approved text must be indexable");
 const xml=await (await get("/sitemap.xml")).text();
 assert.ok(xml.includes("/sudebnye-akty/"+slug));
 const search=await get("/sudebnye-akty?q="+encodeURIComponent(phrase));
 assert.equal(search.status,200);
 assert.ok((await search.text()).includes("/sudebnye-akty/"+slug));
 const updated=await db.query(`
 UPDATE court_act_documents SET full_text=full_text || ' Изменение' WHERE slug=$1
 RETURNING status,source_checked_at,privacy_checked_at,published_at`,[slug]);
 assert.equal(updated.rows[0].status,"review");
 assert.equal(updated.rows[0].source_checked_at,null);
 assert.equal(updated.rows[0].privacy_checked_at,null);
 assert.equal(updated.rows[0].published_at,null);
 const blocked=await get("/sudebnye-akty/"+slug);
 assert.equal(blocked.status,404,"Text edit must revoke public route");
 assert.ok(!(await (await get("/sitemap.xml")).text()).includes("/sudebnye-akty/"+slug));
 console.log({onSiteHTML:true,canonical:true,fullRussianText:true,FTS:true,sitemap:true,editRevocation:true,
 testSourceSha256:createHash("sha256").update(text).digest("hex")});
}finally{
 if(inserted)await db.query("DELETE FROM court_act_documents WHERE slug=$1",[slug]);
 await db.end();
}
