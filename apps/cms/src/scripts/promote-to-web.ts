// Explicit one-way audited publication: Payload CMS -> PUBLIC SITE staging DB.
// No scheduling, no HTTP endpoints, no automatic Webflow switch.
import pg from "pg";
import { normalizeApprovedPage } from "../lib/promotion";

const mode = process.argv[2] || "--dry-run";
if (!["--dry-run","--apply"].includes(mode) || process.argv.length > 3)
  throw new Error("Use --dry-run or --apply");
if (!process.env.CMS_DATABASE_URL || !process.env.PAYLOAD_SECRET ||
    process.env.PAYLOAD_SECRET.length < 32)
  throw new Error("CMS_DATABASE_URL and strong PAYLOAD_SECRET required");
if (mode === "--apply" && (
  process.env.CMS_PROMOTE_CONFIRM !== "yes" ||
  process.env.CMS_PROMOTE_TARGET_STAGING !== "yes" ||
  !process.env.SITE_DATABASE_URL
)) throw new Error("Promotion requires explicit staging confirmation and SITE_DATABASE_URL");

const [{ getPayload },{ default: config }] = await Promise.all([
  import("payload"),import("../payload.config")
]);
const payload = await getPayload({config});
const pages = [];
let cursor=1;
for (;;) {
  if (cursor>100) throw new Error("Too many CMS pages for one migration run");
  const result = await payload.find({
    collection:"editorial-entries",
    where:{reviewState:{equals:"approved"}},
    draft:false,overrideAccess:true,depth:0,limit:100,page:cursor,
  });
  for (const doc of result.docs) {
    if (doc._status === "published") pages.push(normalizeApprovedPage(doc));
  }
  if (!result.hasNextPage) break;
  cursor++;
}
if (mode !== "--apply") {
  console.log(JSON.stringify({mode:"dry-run",eligible:pages.length,writes:0},null,2));
  process.exit(0);
}
const client = new pg.Client({
  connectionString:process.env.SITE_DATABASE_URL,
  connectionTimeoutMillis:10000,query_timeout:15000,statement_timeout:15000,
});
await client.connect();
let committed=false;
try {
  await client.query("BEGIN");
  const run=await client.query(
    "INSERT INTO ingestion_runs (pipeline,status,seen_count) VALUES ($1,'running',$2) RETURNING id",
    ["payload_approved_promotion",pages.length]
  );
  for (const p of pages) {
    // Step 1: stage changed content in review; SQL trigger revokes old approval
    // whenever titles, links or bodies change.
    const staged=await client.query(`INSERT INTO editorial_pages
      (slug,kind,title,seo_title,seo_description,body,source_url,editorial_status)
      VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,'review')
      ON CONFLICT(slug) DO UPDATE SET
        kind=EXCLUDED.kind,title=EXCLUDED.title,
        seo_title=EXCLUDED.seo_title,seo_description=EXCLUDED.seo_description,
        body=EXCLUDED.body,source_url=EXCLUDED.source_url,
        editorial_status='review',checked_at=NULL,reviewed_by=NULL,
        published_at=NULL,updated_at=now()
      WHERE editorial_pages.editorial_status IN ('draft','review','verified')
         OR (editorial_pages.editorial_status='published'
             AND editorial_pages.reviewed_by LIKE 'payload-user:%')
      RETURNING id`,
      [p.slug,p.kind,p.title,p.seoTitle,p.seoDescription,JSON.stringify(p.blocks),p.sourceUrl]
    );
    if (staged.rows.length !== 1) throw new Error(`Refusing to overwrite non-Payload review for slug ${p.slug}`);
    // Step 2: mark approved without changing content; this is one atomic
    // transaction so intermediate draft is never visible to public readers.
    const published=await client.query(`UPDATE editorial_pages
      SET checked_at=$2::timestamptz,reviewed_by=$3,editorial_status='published',
          published_at=now(),updated_at=now()
      WHERE id=$1 RETURNING id`,[staged.rows[0].id,p.checkedAt,p.reviewedBy]);
    if (published.rows.length !== 1) throw new Error("Approval transaction failed");
  }
  await client.query("UPDATE ingestion_runs SET status='succeeded',inserted_count=$2,finished_at=now() WHERE id=$1",
    [run.rows[0].id,pages.length]);
  await client.query("COMMIT");
  committed=true;
  console.log(JSON.stringify({mode:"staging-approved",promoted:pages.length},null,2));
} finally {
  if (!committed) await client.query("ROLLBACK");
  await client.end();
}
process.exit(0);
