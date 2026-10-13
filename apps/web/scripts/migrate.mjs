import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required (see .env.example)');
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const directory = path.resolve(process.cwd(), '../../db/migrations');
await client.connect();
try {
  await client.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
  for (const filename of (await fs.readdir(directory)).filter((x) => x.endsWith('.sql')).sort()) {
    const exists = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [filename]);
    if (exists.rowCount) continue;
    await client.query('BEGIN');
    try {
      await client.query(await fs.readFile(path.join(directory, filename), 'utf8'));
      await client.query('INSERT INTO schema_migrations(name) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log('Applied migration:', filename);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
  }
} finally {
  await client.end();
}
