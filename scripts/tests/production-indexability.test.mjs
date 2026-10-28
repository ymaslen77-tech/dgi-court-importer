import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const sampleNews = JSON.parse(read("apps/web/src/data/housing-news.json"));
const sampleActs = JSON.parse(read("apps/web/src/data/verified-court-static.json"));

test("production may index, but preview environment stays noindex and robots-disallowed", () => {
  const root=read("apps/web/src/app/layout.tsx");
  const pages=read("apps/web/src/data/pages.ts");
  const config=read("apps/web/next.config.ts");
  const robots=read("apps/web/src/app/robots.ts");
  assert.match(root,/robots: \{ index: siteIsLive, follow: siteIsLive \}/);
  assert.match(pages,/SITE_RELEASE_APPROVED === "yes"/);
  assert.match(pages,/SITE_CUTOVER === "true"/);
  assert.match(pages,/host !== "dgi-pravo.ru"/);
  assert.match(config,/host === "dgi-pravo.ru"/);
  assert.match(config,/X-Robots-Tag/);
  assert.match(config,/noindex, nofollow, noarchive/);
  assert.match(robots,/if \(!siteIsLive\)/);
  assert.match(robots,/disallow:"\/"/); // preview robots is closed
});

test("sitemap includes published news and full-text court pages with canonical production host", () => {
  const sitemap=read("apps/web/src/app/sitemap.ts");
  assert.match(sitemap,/if \(!siteIsLive\) return \[\]/);
  assert.match(sitemap,/listPublishedEditorialSlugs\(\)/);
  assert.match(sitemap,/listHousingNews\(\)/);
  assert.match(sitemap,/listPublicCourtCaseSlugs\(\)/);
  assert.match(sitemap,/lastModified: new Date\(article.publishedAt\)/);
  assert.match(sitemap,/\/o-proekte/);
  assert.match(sitemap,/new URL\(path, siteOrigin\)/);
  assert.ok(sampleNews.length>0);
  assert.ok(sampleActs.length>=6);
});

test("court landing and individual acts have crawlable server-rendered links and canonical metadata", () => {
  const court=read("apps/web/src/app/sudebnaya-praktika-dgi/page.tsx");
  const listing=read("apps/web/src/components/VerifiedCourtExplorer.tsx");
  const detail=read("apps/web/src/app/sudebnaya-praktika-dgi/[slug]/page.tsx");
  assert.match(court,/await searchVerifiedCourtActs\(""(?:)\)/);
  assert.match(court,/initialItems=\{initialItems\}/);
  assert.match(listing,/useState<VerifiedCase\[]>\(initialItems\)/);
  assert.match(listing,/Link href=\{\`\/sudebnaya-praktika-dgi\/\$\{item.slug\}\`\}/);
  assert.match(detail,/getPublicCourtCase\(slug\)/);
  assert.match(detail,/full_text.split/);
  assert.match(detail,/alternates: \{canonical:canonical\(act.slug\)\}/);
  assert.match(detail,/if \(!siteIsLive\) notFound\(\)/);
  assert.match(detail,/robots: \{index:true,follow:true\}/);
});

test("standalone news and factual policy pages may be indexed; legal previews remain excluded", () => {
  const news=read("apps/web/src/app/novosti-zhilishchnogo-prava/page.tsx");
  const story=read("apps/web/src/app/novosti-zhilishchnogo-prava/[slug]/page.tsx");
  const policy=read("apps/web/src/app/o-proekte/page.tsx");
  const preview=read("apps/web/src/app/specializirovannyy-zhilishchnyy-fond/page.tsx");
  const retired=read("apps/web/src/app/dgi-court-cases/[slug]/page.tsx");
  assert.match(news,/index: siteIsLive/);
  assert.match(story,/canonical:/);
  assert.match(policy,/index: siteIsLive/);
  assert.match(preview,/index:false/);
  assert.match(retired,/index: false/);
});

test("sitemap and court index never authorize unpublished CMS/DB rows or PDF-only index paths", () => {
  const sitemap=read("apps/web/src/app/sitemap.ts");
  const service=read("apps/web/src/data/verified-courts.ts");
  assert.match(sitemap,/listPublishedEditorialSlugs/);
  assert.match(sitemap,/listPublishedCourtActSlugs/);
  assert.match(service,/isOfficialPublishedCase\(row\)/);
  assert.match(service,/source_checked === true/);
  assert.match(service,/privacy_screen_passed === true/);
  assert.doesNotMatch(sitemap,/court-pdf-copies/);
  assert.doesNotMatch(sitemap,/\/api\/courts\/verified/);
});
