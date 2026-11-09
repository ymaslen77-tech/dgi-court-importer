import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const pages=Array.from({length:6},(_,i)=>JSON.parse(read(`src/data/pages-${i}.json`))).flat();

test("all 33 migrated routes have unique usable page title and meta description",()=>{
 assert.equal(pages.length,33);
 assert.equal(new Set(pages.map(p=>p.slug)).size,33);
 assert.equal(new Set(pages.map(p=>p.seoTitle)).size,33);
 assert.equal(new Set(pages.map(p=>p.description)).size,33);
 for(const p of pages){
  assert.ok(p.seoTitle?.trim().length>=20,`Missing short page title: ${p.slug}`);
  assert.ok(p.description?.trim().length>=60,`Missing description: ${p.slug}`);
  assert.ok(p.description.length<300,`Description unexpectedly long: ${p.slug}`);
 }
});
test("SEO social tags come from the actual page and never open legal drafts",()=>{
 const root=read("src/app/layout.tsx");
 const page=read("src/app/page.tsx");
 const routes=read("src/app/[...slug]/page.tsx");
 const court=read("src/app/sudebnaya-praktika-dgi/page.tsx");
 const social=read("src/data/seo-social.ts");
 assert.match(root,/metadataBase: new URL\(publicSiteOrigin\)/);
 assert.match(root,/publicSiteOrigin = "https:\/\/dgi-pravo.ru"/);
 assert.match(root,/openGraph:/);
 assert.match(root,/twitter:/);
 assert.match(page,/title: page.seoTitle/);
 assert.match(routes,/factualSocialMetadata\(slug, page.seoTitle, page.description\)/);
 assert.match(routes,/factualSocialMetadata\(slug, guide.title, guide.summary\)/);
 assert.match(routes,/factualSocialMetadata\(slug, dgiServiceRegistryTitle/);
 assert.match(routes,/factualSocialMetadata\(slug, housingLawCatalogTitle/);
 assert.match(court,/factualSocialMetadata\("sudebnaya-praktika-dgi"/);
 assert.match(social,/new URL\(path, "https:\/\/dgi-pravo.ru"\)/);
 assert.match(routes,/canIndexPage\(page\)/);
 assert.match(root,/robots: \{ index: siteIsLive, follow: siteIsLive \}/);
});
test("no unapproved legal page leaks into sitemap, canonical or rich results",()=>{
 const pagesConfig=read("src/data/pages.ts");
 const sitemap=read("src/app/sitemap.ts");
 const robots=read("src/app/robots.ts");
 const config=read("next.config.ts");
 const proxy=read("src/proxy.ts");
 const structured=read("src/components/SeoMarkup.tsx");
 assert.match(pagesConfig,/SITE_CUTOVER === "true"/);
 assert.match(pagesConfig,/SITE_RELEASE_APPROVED === "yes"/);
 assert.match(pagesConfig,/editoriallyApproved === true/);
 assert.match(sitemap,/if \(!siteIsLive\) return \[\]/);
 assert.match(sitemap,/listPublishedEditorialSlugs/);
 assert.match(sitemap,/listHousingNews/);
 assert.match(sitemap,/listPublicCourtCaseSlugs/);
 assert.match(robots,/disallow: "\/"/);
 assert.doesNotMatch(config,/key: "X-Robots-Tag"/);
 assert.match(proxy,/X-Robots-Tag/);
 assert.match(proxy,/noindex, nofollow, noarchive/);
 assert.match(proxy,/SITE_RELEASE_APPROVED === "yes"/);
 assert.match(proxy,/SITE_CUTOVER === "true"/);
 assert.match(structured,/if \(!canIndexPage\(page\)\) return null/);
});
test("legal editorial policy is visible site-wide without made-up credentials",()=>{
 const shell=read("src/components/PageShell.tsx");
 const policy=read("src/app/o-proekte/page.tsx");
 assert.match(shell,/href="\/o-proekte"/);
 assert.match(policy,/не официальный сайт ДГИ/);
 assert.match(policy,/pravo.gov.ru/);
 assert.match(policy,/vestnikmoscow.mos.ru/);
 assert.match(shell,/Независимый информационно-правовой справочник/);
 assert.match(policy,/robots: \{ index: siteIsLive, follow: siteIsLive \}/);
});


test("published homepage has one factual WebSite graph and an independent name",()=>{
  const home=read("src/app/page.tsx");
  const seo=read("src/components/SeoMarkup.tsx");
  const layout=read("src/app/layout.tsx");
  const shell=read("src/components/PageShell.tsx");
  assert.ok(home.includes("<SeoMarkup page={page} />"));
  assert.ok(seo.includes("if (!canIndexPage(page)) return null"));
  assert.ok(seo.includes('"@type":"WebSite"'));
  assert.ok(seo.includes('name:"Жилищный справочник Москвы"'));
  assert.ok(layout.includes('const brand = "Жилищный справочник Москвы"'));
  assert.ok(shell.includes("Независимый информационно-правовой справочник"));
});

test("published news has factual schema with source but no fabricated author",()=>{
  const code=read("src/app/novosti-zhilishchnogo-prava/[slug]/page.tsx");
  assert.ok(code.includes('"@type": "NewsArticle"'));
  assert.ok(code.includes("datePublished: article.publishedAt"));
  assert.ok(code.includes("isBasedOn: article.sourceUrl"));
  assert.ok(code.includes("structuredData = siteIsLive ?"));
  assert.ok(!code.includes("author: {"));
  assert.ok(!code.includes("dateModified: new Date"));
});
