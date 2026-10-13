import fs from 'node:fs/promises';
import path from 'node:path';

const SITE_ID = process.env.WEBFLOW_SITE_ID || '6aca6bde03aad0f2e3c19259';
const TOKEN = process.env.WEBFLOW_TOKEN;
const OUT = path.resolve(process.cwd(), '../../.private/webflow');
const INCLUDE_ITEMS = process.argv.includes('--include-items');
if (!TOKEN) throw new Error('WEBFLOW_TOKEN is required; never commit tokens or raw exports.');

async function api(endpoint) {
  const res = await fetch('https://api.webflow.com/v2' + endpoint, {
    headers: { Authorization: 'Bearer ' + TOKEN, Accept: 'application/json' },
    redirect: 'error',
  });
  if (!res.ok) throw new Error('Webflow request failed: HTTP ' + res.status + ' at ' + endpoint.split('?')[0]);
  return res.json();
}
async function paginated(url, key) {
  const items = [];
  for (let offset = 0; offset < 200000; offset += 100) {
    const page = await api(url + (url.includes('?') ? '&' : '?') + 'limit=100&offset=' + offset);
    const batch = page[key];
    if (!Array.isArray(batch)) throw new Error('Unexpected Webflow response for ' + key);
    items.push(...batch);
    if (batch.length < 100) return items;
  }
  throw new Error('Pagination bound exceeded');
}
async function store(name, data) {
  await fs.mkdir(OUT, { recursive: true, mode: 0o700 });
  const file = path.join(OUT, name);
  await fs.writeFile(file, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
  console.log('Saved private export:', name, Array.isArray(data) ? data.length : '');
}
const pages = await paginated('/sites/' + SITE_ID + '/pages', 'pages');
const collections = await paginated('/sites/' + SITE_ID + '/collections', 'collections');
await store('pages.json', pages);
await store('collections.json', collections);
if (INCLUDE_ITEMS) {
  // Explicit opt-in only: CMS data can include personal information.
  // These files are deliberately ignored by Git and must be reviewed before sharing.
  for (const collection of collections) {
    const items = await paginated('/collections/' + encodeURIComponent(collection.id) + '/items', 'items');
    await store('collection-' + collection.id + '.json', items);
  }
}
console.log('Webflow exports are private and do not include full Designer element text.');
