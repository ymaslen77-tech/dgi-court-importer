import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const origin=process.env.STAGING_TEST_ORIGIN || "http://127.0.0.1:3000";
const manifest=JSON.parse(readFileSync(new URL("../migration/webflow-seo-manifest.json",import.meta.url),"utf8"));
async function fetchReady(path) {
  return fetch(new URL(path,origin),{redirect:"manual",signal:AbortSignal.timeout(15000)});
}
let ready=false;
for(let attempt=0;attempt<40;attempt++) {
  try {
    const response=await fetchReady("/api/health");
    if(response.ok){ready=true;break;}
  } catch {}
  await new Promise(resolve=>setTimeout(resolve,500));
}
assert.ok(ready,"Next.js server did not become healthy");
const robots=await (await fetchReady("/robots.txt")).text();
assert.match(robots,/Disallow: \/(?:\n|\r|$)/i,"Staging robots must block indexation");
const sitemap=await (await fetchReady("/sitemap.xml")).text();
assert.ok(!/<loc>/i.test(sitemap),"Staging sitemap must not publish URLs");
for (const page of manifest.pages) {
  const response=await fetchReady(page.path);
  assert.equal(response.status,200,`Missing page: ${page.path}`);
  const html=await response.text();
  assert.ok(html.includes("<h1"),`Missing h1: ${page.path}`);
  assert.ok(/<title[> ]/i.test(html),`Missing title: ${page.path}`);
  assert.ok(/noindex/i.test(html),`Indexing was enabled on staging: ${page.path}`);
  assert.ok(/rel="canonical"/i.test(html),`Missing canonical: ${page.path}`);
}
const missing=await fetchReady("/does-not-exist-staging-check-987654321");
assert.equal(missing.status,404);
console.log(JSON.stringify({pages:manifest.pages.length,robots:"blocked",sitemap:"empty",unknownRoute:404}));
