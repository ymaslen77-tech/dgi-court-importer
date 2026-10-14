import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const batches = Array.from({ length: 6 }, (_, i) =>
  JSON.parse(readFileSync(new URL(`../src/data/pages-${i}.json`, import.meta.url), "utf8")),
);
const pages = batches.flat();

test("all published public pages are represented exactly once", () => {
  assert.equal(pages.length, 33);
  assert.equal(new Set(pages.map((p) => p.slug)).size, pages.length);
  for (const p of pages) {
    assert.ok(p.title && p.seoTitle);
    assert.ok(p.source.startsWith("https://dgimos.webflow.io/"));
    assert.ok(p.blocks.length >= 5, `No migrated content for ${p.slug}`);
  }
});

test("no unsafe schemes in recovered links", () => {
  for (const p of pages) for (const b of p.blocks) {
    if (b.kind === "link") {
      assert.ok(b.href.startsWith("/") || b.href.startsWith("https://"));
      assert.ok(!b.href.startsWith("//"));
    }
  }
});

test("legacy court data has no asserted judgment outcome", () => {
  const data = JSON.parse(readFileSync(new URL("../src/data/legacy-cases.json", import.meta.url), "utf8"));
  assert.equal(data.cases.length, 22);
  for (const c of data.cases) {
    assert.equal(c.verifiedAct, false);
    assert.ok(!Object.hasOwn(c, "outcome"));
    assert.ok(!Object.hasOwn(c, "parties"));
  }
});

test("all preserved deep links resolve to migrated heading anchors", () => {
  const anchors = JSON.parse(readFileSync(new URL("../src/data/legacy-anchors.json", import.meta.url), "utf8"));
  const ids = new Set();
  for (const anchor of anchors) {
    const page = pages.find((p) => p.slug === anchor.slug);
    assert.ok(page, `Unknown destination page: ${anchor.slug}`);
    assert.ok(page.blocks.some((b) => /^h[1-4]$/.test(b.kind) && b.text === anchor.heading),
      `Destination heading missing: ${anchor.slug}#${anchor.id}`);
    const unique = `${anchor.slug}#${anchor.id}`;
    assert.ok(!ids.has(unique), `Duplicate anchor: ${unique}`);
    ids.add(unique);
  }
  for (const page of pages) for (const block of page.blocks) {
    if (block.kind !== "link" || !block.href?.startsWith("/") || !block.href.includes("#")) continue;
    const [path, fragment] = block.href.split("#");
    const targetSlug = path.split("/").filter(Boolean).join("/");
    assert.ok(ids.has(`${targetSlug}#${fragment}`),
      `Broken deep link from ${page.slug}: ${block.href}`);
  }
});

test("content routes render reviewed CMS pages, including new slugs", () => {
  const route = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
  assert.match(route, /const page = \(await getPublishedEditorialPage\(slug\)\) \?\? getMigratedPage\(slug\)/);
  assert.ok(!route.includes("const page = getMigratedPage(slug);"));
});

test("published Webflow court-case slugs have protected archival routes", () => {
  const cases=JSON.parse(readFileSync(new URL("../src/data/legacy-cases.json",import.meta.url),"utf8")).cases;
  assert.equal(cases.length,22);
  const route=readFileSync(new URL("../src/app/dgi-court-cases/[slug]/page.tsx",import.meta.url),"utf8");
  assert.match(route,/legacyCases\.find/);
  assert.match(route,/index:false,follow:false/);
  assert.ok(!route.includes("entry.title"));
  assert.ok(cases.every(c=>c.verifiedAct===false && /^[a-z0-9-]+$/.test(c.slug)));
});

test("production indexation requires independent release approval and HTTPS canonical", () => {
  const release = readFileSync(new URL("../src/data/pages.ts",import.meta.url),"utf8");
  assert.match(release,/SITE_RELEASE_APPROVED === "yes"/);
  assert.match(release,/SITE_CUTOVER === "true"/);
  assert.match(release,/url.protocol !== "https:"/);
  assert.match(release,/host.endsWith\("\.webflow.io"\)/);
});

test("CMS detail URLs stay nested and are read only from approved database projection", () => {
  const route = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
  const adapter = readFileSync(new URL("../src/data/published.ts", import.meta.url), "utf8");
  assert.ok(route.includes('return parts.join("/")'));
  assert.ok(route.includes("getPublishedEditorialPage(slug)"));
  assert.ok(adapter.includes("editorial_status = 'published'"));
  assert.ok(adapter.includes("checked_at IS NOT NULL"));
});

test("page template includes factual gated SEO schema and a keyboard skip link", () => {
  const markup = readFileSync(new URL("../src/components/SeoMarkup.tsx",import.meta.url),"utf8");
  const shell = readFileSync(new URL("../src/components/PageShell.tsx",import.meta.url),"utf8");
  const article = readFileSync(new URL("../src/components/MigratedArticle.tsx",import.meta.url),"utf8");
  assert.ok(markup.includes("if (!siteIsLive) return null"));
  assert.ok(markup.includes('application/ld+json'));
  assert.ok(markup.includes("BreadcrumbList"));
  assert.ok(shell.includes('href="#main-content"'));
  assert.ok(article.includes('<SeoMarkup page={page} />'));
});

test("home hero precedes service navigation and original article body", () => {
  const home = readFileSync(new URL("../src/app/page.tsx",import.meta.url),"utf8");
  const article = readFileSync(new URL("../src/components/MigratedArticle.tsx",import.meta.url),"utf8");
  assert.ok(home.includes('<MigratedArticle page={page} home afterHero={'));
  assert.ok(home.includes('className="topic-section" id="services"'));
  assert.ok(article.indexOf('{afterHero}') > article.indexOf('className="hero"'));
  assert.ok(article.indexOf('{afterHero}') < article.indexOf('className="article-section"'));
});

test("verified Webflow thematic pages use a light, separate content template",()=>{
 const themes=readFileSync(new URL("../src/data/themes.ts",import.meta.url),"utf8");
 const article=readFileSync(new URL("../src/components/MigratedArticle.tsx",import.meta.url),"utf8");
 const route=readFileSync(new URL("../src/app/[...slug]/page.tsx",import.meta.url),"utf8");
 const header=readFileSync(new URL("../src/components/PageShell.tsx",import.meta.url),"utf8");
 const home=readFileSync(new URL("../src/app/page.tsx",import.meta.url),"utf8");
 for(const slug of ["privatizaciya-zhilya","socialnyj-naem","renovaciya-pereselenie"])
   assert.ok(themes.includes(slug));
 assert.ok(article.includes("hero--thematic"));
 assert.ok(article.includes("editorial-notice"));
 assert.ok(route.includes("isThematicSlug(slug)"));
 assert.ok(header.includes("site--"));
 assert.ok(home.includes('variant="home"'));
});

test("home header can emphasize an existing source phrase without inventing text",()=>{
 const article=readFileSync(new URL("../src/components/MigratedArticle.tsx",import.meta.url),"utf8");
 assert.ok(article.includes('lastIndexOf("по жилищным вопросам")'));
 assert.ok(article.includes("heading.slice(accentAt)"));
 assert.ok(article.includes('className="hero-accent"'));
});

test("home nav and hero expose both original primary and secondary actions",()=>{
 const shell=readFileSync(new URL("../src/components/PageShell.tsx",import.meta.url),"utf8");
 const article=readFileSync(new URL("../src/components/MigratedArticle.tsx",import.meta.url),"utf8");
 assert.ok(shell.includes('href="/#services"'));
 assert.ok(shell.includes("РАЗОБРАТЬ СИТУАЦИЮ"));
 assert.ok(article.includes("КАК МЫ РАБОТАЕМ"));
 assert.ok(article.includes("hero-link-secondary"));
});


test("all fifteen Webflow light-layout pages use the source-verified thematic variant",()=>{
 const themes=readFileSync(new URL("../src/data/themes.ts",import.meta.url),"utf8");
 const target=["dokumenty-na-kvartiru","funkcii-dgi","gorodskoe-imushchestvo-i-zemlya",
 "gosuslugi-dgi","kadastrovaya-stoimost","kontakty-dgi","normativnye-akty",
 "privatizaciya-zhilya","renovaciya-pereselenie","socialnyj-naem",
 "spory-s-dgi","sudebnaya-praktika-dgi","zhilishchnaya-ochered",
 "zhilishchnye-subsidii","zhilishchnyj-uchet"];
 const active=[...themes.matchAll(/^  "([a-z0-9-]+)",$/gm)].map(x=>x[1]);
 assert.deepEqual(active.sort(),target.sort());
 const sourcePage=readFileSync(new URL("../src/app/sudebnaya-praktika-dgi/page.tsx",import.meta.url),"utf8");
 assert.ok(sourcePage.includes('<PageShell variant="thematic">'));
 assert.ok(sourcePage.includes('hero hero--thematic'));
});
test("accent spans reuse existing headings rather than introducing unsupported wording",()=>{
 const themes=readFileSync(new URL("../src/data/themes.ts",import.meta.url),"utf8");
 const article=readFileSync(new URL("../src/components/MigratedArticle.tsx",import.meta.url),"utf8");
 assert.ok(themes.includes("sourceHeadingAccentIndex"));
 assert.ok(article.includes("heading.slice(accentAt)"));
 assert.ok(article.includes("heading.slice(0, accentAt)"));
 assert.ok(!article.includes("копия действующего административного регламента"));
});
