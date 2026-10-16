#!/usr/bin/env node
// Run from repository root. Default dry-run has no DB connection or side effects.
import { prepareMigrationData } from "./lib/prepare-migration-data.mjs";

const args = process.argv.slice(2);
if (args.some((a) => !["--apply","--dry-run"].includes(a)) ||
    (args.includes("--apply") && args.includes("--dry-run")))
  throw new Error("Usage: node scripts/import-snapshots-to-db.mjs [--dry-run|--apply]");
const apply = args.includes("--apply"), data = prepareMigrationData();
if (!apply) {
  console.log(JSON.stringify({mode:"dry-run",...data.counts,publications:0,dbWrites:0},null,2));
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required for --apply");
const { default: pg } = await import("pg");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
await client.connect();
let committed = false;
try {
  await client.query("BEGIN");
  const run = await client.query(
    "INSERT INTO ingestion_runs (pipeline,status,seen_count) VALUES ($1,'running',$2) RETURNING id",
    ["webflow_snapshot_migration",data.pages.length + data.cases.length]);
  const pageSQL = "INSERT INTO editorial_pages (slug,kind,title,seo_title,seo_description,body,editorial_status,source_url) " +
    "VALUES ($1,$2,$3,$4,$5,$6::jsonb,'review',$7) ON CONFLICT (slug) DO UPDATE SET " +
    "title=EXCLUDED.title,seo_title=EXCLUDED.seo_title,seo_description=EXCLUDED.seo_description," +
    "body=EXCLUDED.body,source_url=EXCLUDED.source_url,updated_at=now() " +
    "WHERE editorial_pages.editorial_status IN ('draft','review')";
  for (const page of data.pages) {
    const kind = ["","novosti-zhilishchnogo-prava"].includes(page.slug) ? "landing" : "guide";
    await client.query(pageSQL,[page.slug,kind,page.title,page.seoTitle,page.description,
      JSON.stringify(page.blocks),page.source]);
  }
  const caseSQL = "INSERT INTO court_cases (stable_key,uid,topic,editorial_status,act_verified) " +
    "VALUES ($1,$2,$3,$4,false) ON CONFLICT (stable_key) DO UPDATE SET " +
    "uid=EXCLUDED.uid,topic=EXCLUDED.topic,updated_at=now() " +
    "WHERE court_cases.editorial_status IN ('candidate','review') AND court_cases.act_verified=false RETURNING id";
  const instanceSQL = "INSERT INTO court_instances (case_id,court_name,case_number,instance_type) " +
    "VALUES ($1,$2,$3,'unknown') ON CONFLICT (case_id,court_name,case_number) " +
    "DO UPDATE SET case_number=EXCLUDED.case_number RETURNING id";
  const sourceSQL = "INSERT INTO court_sources (instance_id,source_url,publisher,source_type,document_checked) " +
    "VALUES ($1,$2,$3,'court_card',false) ON CONFLICT (instance_id,source_url) DO NOTHING";
  for (const item of data.cases) {
    const record = await client.query(caseSQL,[item.key,item.uid,item.topic,item.verification]);
    if (!record.rows.length) continue; // Do not rewrite editorially verified rows.
    const instance = await client.query(instanceSQL,
      [record.rows[0].id,item.court,item.number]);
    if (item.officialUrl) await client.query(sourceSQL,
      [instance.rows[0].id,item.officialUrl,item.publisher]);
  }
  await client.query("UPDATE ingestion_runs SET status='succeeded',inserted_count=$2,finished_at=now() WHERE id=$1",
    [run.rows[0].id,data.pages.length + data.cases.length]);
  await client.query("COMMIT");
  committed=true;
  console.log(JSON.stringify({mode:"applied",...data.counts,publications:0,assertedOutcomes:0}));
} finally {
  if (!committed) await client.query("ROLLBACK");
  await client.end();
}
