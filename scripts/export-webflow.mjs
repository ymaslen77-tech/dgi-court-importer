#!/usr/bin/env node
/**
 * Manual archival export only. It never publishes or changes Webflow.
 * The raw CMS files may contain personal information; they stay in gitignored
 * .migration/ and must be reviewed/sanitized before any public import.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const token = process.env.WEBFLOW_TOKEN;
const siteId = process.env.WEBFLOW_SITE_ID || "6aca6bde03aad0f2e3c19259";
if (!token) throw new Error("Set WEBFLOW_TOKEN in environment (never commit it)");
if (!/^[a-f0-9]{24}$/.test(siteId)) throw new Error("Invalid Webflow site ID");

const dest = resolve(".migration/webflow");
await mkdir(dest, { recursive: true });

async function request(route) {
  const response = await fetch(`https://api.webflow.com/v2${route}`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`Webflow HTTP ${response.status} on ${route}`);
  return response.json();
}

async function allItems(path, key) {
  const out = [];
  for (let offset = 0; offset <= 100000; offset += 100) {
    const joiner = path.includes("?") ? "&" : "?";
    const data = await request(`${path}${joiner}limit=100&offset=${offset}`);
    const items = data[key] ?? [];
    out.push(...items);
    if (items.length < 100 || out.length >= (data.pagination?.total ?? Infinity)) return out;
  }
  throw new Error("Pagination cap reached; split export manually");
}

const pages = await allItems(`/sites/${siteId}/pages`, "pages");
await writeFile(join(dest, "pages.json"), JSON.stringify(pages, null, 2), { mode: 0o600 });

const collections = await allItems(`/sites/${siteId}/collections`, "collections");
await writeFile(join(dest, "collections.json"), JSON.stringify(collections, null, 2), { mode: 0o600 });
for (const c of collections) {
  if (!/^[a-f0-9]{24}$/.test(c.id)) throw new Error("Unexpected collection identifier");
  const items = await allItems(`/collections/${c.id}/items`, "items");
  await writeFile(join(dest, `cms-${c.id}.json`), JSON.stringify(items, null, 2), { mode: 0o600 });
}
console.log(JSON.stringify({ siteId, pages: pages.length, collections: collections.length, destination: dest, publicUpload: false }));
