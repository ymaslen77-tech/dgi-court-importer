#!/usr/bin/env node
// Import only safe CMS source metadata. It is NEVER published to the public site.
import { prepareCmsInventory } from "./lib/prepare-cms-inventory.mjs";

const args = process.argv.slice(2);
if (args.some((a) => !["--dry-run", "--apply"].includes(a)) ||
    (args.includes("--dry-run") && args.includes("--apply")))
  throw new Error("Usage: node scripts/import-cms-inventory.mjs [--dry-run|--apply]");
const apply = args.includes("--apply");
const { records, counts } = prepareCmsInventory();
if (!apply) {
  console.log(JSON.stringify({ mode: "dry-run", ...counts, databaseWrites: 0 }, null, 2));
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL must be set before --apply");
const { default: pg } = await import("pg");
const db = new pg.Client({
  connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000,
});
await db.connect();
let done = false;
try {
  await db.query("BEGIN");
  const run = await db.query(
    "INSERT INTO ingestion_runs (pipeline,status,seen_count) VALUES ('webflow_cms_inventory','running',$1) RETURNING id",
    [records.length],
  );
  const sql = `INSERT INTO webflow_cms_staging
    (source_collection,source_item_id,slug,display_title,source_status,
     verified,publication_allowed,editorial_status,metadata)
    VALUES ($1,$2,$3,$4,$5,false,false,'review',$6::jsonb)
    ON CONFLICT (source_collection,source_item_id) DO UPDATE SET
      slug=EXCLUDED.slug,display_title=EXCLUDED.display_title,
      source_status=EXCLUDED.source_status,metadata=EXCLUDED.metadata,
      imported_at=now()
    WHERE webflow_cms_staging.editorial_status='review'
      AND webflow_cms_staging.verified=false
      AND webflow_cms_staging.publication_allowed=false`;
  for (const row of records) {
    await db.query(sql, [
      row.collection, row.id, row.slug, row.title,
      row.sourceStatus, JSON.stringify(row.metadata),
    ]);
  }
  await db.query(
    "UPDATE ingestion_runs SET status='succeeded',inserted_count=$2,finished_at=now() WHERE id=$1",
    [run.rows[0].id, records.length],
  );
  await db.query("COMMIT");
  done = true;
  console.log(JSON.stringify({
    mode: "staging-applied", ...counts,
    autoPublished: 0, checkedJudicialActs: 0,
  }, null, 2));
} finally {
  if (!done) await db.query("ROLLBACK");
  await db.end();
}
