import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const ALLOWED = ['mos-gorsud.ru', 'sudrf.ru', 'vsrf.ru', 'kad.arbitr.ru'];
function officialUrl(raw) {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    return u.protocol === 'https:' && !u.username && !u.password &&
      (u.port === '' || u.port === '443') &&
      ALLOWED.some((domain) => host === domain || host.endsWith('.' + domain));
  } catch {
    return false;
  }
}

const write = process.argv.includes('--write');
const filename = path.resolve(process.cwd(), '../../data/court-catalog.jsonl');
const raw = await fs.readFile(filename, 'utf8');
const candidates = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
const filtered = candidates.filter((c) =>
  c.verification === 'case_metadata_only' && c.act_reviewed === false &&
  typeof c.id === 'string' && typeof c.court === 'string' &&
  typeof c.number === 'string' && officialUrl(c.official_case_url)
);
console.log(JSON.stringify({ total: candidates.length, validMetadataOnly: filtered.length, dryRun: !write }));
if (!write) process.exit(0);
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for --write');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query('BEGIN');
  let count = 0;
  for (const c of filtered) {
    const court = await client.query(
      'INSERT INTO courts(title) VALUES($1) ON CONFLICT(title) DO UPDATE SET title=EXCLUDED.title RETURNING id',
      [c.court.slice(0, 300)]
    );
    // This key groups only candidates and does not certify common identity.
    const group = String(c.instance_group || ('candidate:' + c.id)).slice(0, 260);
    const record = await client.query(
      'INSERT INTO court_cases(provisional_group_key,uid,topic) VALUES($1,$2,$3) ON CONFLICT(provisional_group_key) DO UPDATE SET topic=EXCLUDED.topic RETURNING id',
      [group, c.uid || null, String(c.category || '').slice(0, 300)]
    );
    const inserted = await client.query(
      'INSERT INTO court_instances(case_id,court_id,source_key,case_number,category,official_case_url) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(source_key) DO NOTHING RETURNING id',
      [record.rows[0].id, court.rows[0].id, c.id, c.number, c.category || null, c.official_case_url]
    );
    if (inserted.rowCount) count++;
  }
  await client.query('COMMIT');
  console.log('Imported metadata candidates:', count);
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  await client.end();
}
