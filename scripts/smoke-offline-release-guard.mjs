import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Runs ONLY against a disposable, locally started Next.js production build.
// No deployment, DNS, real public database, or external URL is accessed.
if (process.env.CI !== "true" || process.env.SITE_CUTOVER !== "true" ||
    process.env.SITE_RELEASE_APPROVED !== "yes" ||
    process.env.CMS_PUBLIC_READS !== "false" ||
    process.env.COURT_DB_READS !== "false" ||
    process.env.COURT_FULLTEXT_PUBLIC_READS !== "false")
  throw new Error("Refusing release guard smoke outside isolated CI configuration");

const origin = process.env.OFFLINE_TEST_ORIGIN || "http://127.0.0.1:3000";
const get = (path) => fetch(new URL(path, origin), {
  redirect: "manual", signal: AbortSignal.timeout(15000),
});
let ready = false;
for (let attempt=0; attempt<60; attempt++) {
  try {
    if ((await get("/api/health")).ok) { ready = true; break; }
  } catch {}
  await new Promise(ok => setTimeout(ok, 500));
}
assert.ok(ready, "Offline release-mode server did not become healthy");

const seo = JSON.parse(readFileSync(new URL("../migration/webflow-seo-manifest.json", import.meta.url), "utf8"));
for (const page of seo.pages) {
  // The court *index* is intentionally readable as a noindex source locator,
  // whereas original static editorial snapshots must all return 404.
  if (page.path === "/sudebnaya-praktika-dgi") continue;
  const response = await get(page.path);
  assert.equal(response.status, 404, `Unapproved legacy snapshot became visible: ${page.path}`);
  const html = await response.text();
  assert.match(html, /noindex/i, `Unapproved 404 lacks noindex: ${page.path}`);
  assert.doesNotMatch(html, /rel=["']canonical["']/i, `Unapproved canonical: ${page.path}`);
}
// Derive every draft route from the source inventory, so future legal pages
// cannot bypass release gating merely because a developer forgot this list.
const draftInventory = JSON.parse(readFileSync(
  new URL("../apps/web/src/data/housing-guides.json",import.meta.url),"utf8"
));
const protectedDrafts = [
  "/spravochnik-zhilishchnogo-zakonodatelstva-moskvy",
  "/reestr-gosuslug-dgi",
  "/housing-law-news/unreviewed-source",
  ...draftInventory.guides.map(item=>"/"+item.slug),
];
assert.equal(new Set(protectedDrafts).size,protectedDrafts.length,"Duplicate protected draft path");
for (const path of protectedDrafts) {
  assert.equal((await get(path)).status, 404, `Private legal draft exposed: ${path}`);
}
const legacy = JSON.parse(readFileSync(new URL("../apps/web/src/data/legacy-cases.json",import.meta.url),"utf8"));
for (const entry of legacy.cases) {
  const url = `/dgi-court-cases/${entry.slug}`;
  const response=await get(url);
  assert.equal(response.status, 200, `Legacy archive route lost: ${url}`);
  const html=await response.text();
  assert.match(html, /noindex/i, `Archive exposed to indexing: ${url}`);
  assert.doesNotMatch(html, /rel=["']canonical["']/i);
}
for (const path of ["/sudebnye-akty","/sudebnye-akty/unreviewed-court-act"]) {
  const response=await get(path);
  assert.equal(response.status,404,`Court fulltext leaked without approval: ${path}`);
  assert.match(await response.text(),/noindex/i);
}
const index=await get("/sudebnaya-praktika-dgi");
assert.equal(index.status,200);
assert.match(await index.text(),/noindex/i);
const sitemap=await get("/sitemap.xml");
assert.equal(sitemap.status,200);
assert.doesNotMatch(await sitemap.text(), /<loc>/i, "Unreviewed URLs appeared in live sitemap");
const search=await get("/api/courts/search?q=88-21277%2F2026");
assert.equal(search.status,503, "Unreviewed DB search should remain disabled");
console.log(JSON.stringify({
  isolatedMode:true, legacySnapshotsBlocked:seo.pages.length - 1,
  extraDraftsBlocked:protectedDrafts.length, legacyArchivesNoindex:legacy.cases.length,
  courtIndexNoindex:true, courtFulltextUnpublished:true, sitemapEmpty:true, databaseSearchDisabled:true,
},null,2));
