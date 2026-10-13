#!/usr/bin/env node
// Import Webflow snapshots into STAGING tables. Does not mark anything verified or live.
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [1, 2, 3, 4].map(n => path.join(root, 'migration', 'pages-part-' + n + '.json'));
const pages = files.flatMap(file => JSON.parse(fs.readFileSync(file, 'utf8')));
const cms = JSON.parse(fs.readFileSync(path.join(root, 'migration/webflow-cms.json'), 'utf8'));
const cases = cms.collections.find(x => x.slug === 'dgi-court-cases')?.items || [];
const projection = cases.map(i => ({
  id: i.id, slug: i.fieldData.slug, number: i.fieldData['nomer-dela'] || '',
  court: i.fieldData.sud || '', subject: i.fieldData['kategoriya-spora'] || '',
  official: i.fieldData['oficialnyy-istochnik'] || null,
  status: i.fieldData['status-verifikacii'] || 'unverified',
  reviewed: i.fieldData['sudebnyy-akt-proveren'] === true,
  published: Boolean(i.lastPublished) && !i.isDraft, draft: Boolean(i.isDraft)
}));
if (new Set(pages.map(x => x.slug)).size !== pages.length) throw Error('Duplicate source slugs');
if (new Set(projection.map(x => x.slug)).size !== projection.length) throw Error('Duplicate court slugs');
console.log(JSON.stringify({ mode: process.argv.includes('--apply') ? 'apply' : 'dry-run',
  pages: pages.length, cases: projection.length, publishedCourtItems: projection.filter(x=>x.published).length }));
if (!process.argv.includes('--apply')) process.exit(0);
if (!process.env.DATABASE_URL) throw Error('DATABASE_URL required; no implicit DB connection');
const { default: pg } = await import('pg');
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(fs.readFileSync(path.join(root,'database/001_webflow_staging.sql'),'utf8'));
  await client.query('BEGIN');
  for (const p of pages) {
    await client.query(
      `INSERT INTO webflow_source_pages (webflow_id,slug,title,seo_title,seo_description,content_blocks,source_links)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (webflow_id) DO UPDATE SET
       slug=EXCLUDED.slug,title=EXCLUDED.title,seo_title=EXCLUDED.seo_title,
       seo_description=EXCLUDED.seo_description,content_blocks=EXCLUDED.content_blocks,
       source_links=EXCLUDED.source_links,imported_at=now()
       WHERE webflow_source_pages.migration_state = 'staged'`,
      [p.webflowId,p.slug,p.title,p.seo.title,p.seo.description,JSON.stringify(p.blocks),JSON.stringify(p.links)]
    );
  }
  for (const c of projection) {
    await client.query(
      `INSERT INTO webflow_court_archive
       (webflow_id,slug,case_number,court_name,subject,official_source_url,verification_status,act_reviewed,was_published,was_draft)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (webflow_id) DO UPDATE SET
       slug=EXCLUDED.slug,case_number=EXCLUDED.case_number,court_name=EXCLUDED.court_name,
       subject=EXCLUDED.subject,official_source_url=EXCLUDED.official_source_url,
       verification_status=EXCLUDED.verification_status,act_reviewed=EXCLUDED.act_reviewed,
       was_published=EXCLUDED.was_published,was_draft=EXCLUDED.was_draft,imported_at=now()`,
      [c.id,c.slug,c.number,c.court,c.subject,c.official,c.status,c.reviewed,c.published,c.draft]
    );
  }
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  await client.end();
}
console.log('Staging import completed; nothing published or verified automatically.');
