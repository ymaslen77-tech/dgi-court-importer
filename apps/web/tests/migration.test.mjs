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

test("content routes prefer reviewed CMS pages and restore missing legacy routes as noindex", () => {
  const route = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
  assert.ok(route.includes('const page = (await getPublishedEditorialPage(slug)) ?? getMigratedPage(slug)'));
  assert.ok(route.includes("canIndexPage(page) ? { index: true, follow: true } : { index: false, follow: false }"));
  assert.ok(!route.includes("const page = getMigratedPage(slug);"));
});

test("unverified archival court case links redirect to the verified-only search", () => {
  const cases=JSON.parse(readFileSync(new URL("../src/data/legacy-cases.json",import.meta.url),"utf8")).cases;
  assert.equal(cases.length,22);
  const route=readFileSync(new URL("../src/app/dgi-court-cases/[slug]/page.tsx",import.meta.url),"utf8");
  assert.match(route,/redirect\("\/sudebnaya-praktika-dgi"\)/);
  assert.match(route,/index: false, follow: false/);
  assert.ok(!route.includes("legacyCases.find"));
  assert.ok(cases.every(c=>c.verifiedAct===false));
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
  assert.ok(markup.includes("if (!canIndexPage(page)) return null"));
  assert.ok(markup.includes('application/ld+json'));
  assert.ok(markup.includes("BreadcrumbList"));
  assert.ok(shell.includes('href="#main-content"'));
  assert.ok(article.includes('<SeoMarkup page={page} />'));
});

test("homepage provides a short legal catalogue and practical actions", () => {
  const home = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  assert.ok(home.includes('className="home-intro"'));
  assert.ok(home.includes('id="topics"'));
  assert.ok(home.includes('className="home-task-section"'));
  assert.ok(!home.includes("afterHero="));
});

test("shared legal pages use one light template without redundant editorial banners", () => {
  const article = readFileSync(new URL("../src/components/MigratedArticle.tsx", import.meta.url), "utf8");
  const shell = readFileSync(new URL("../src/components/PageShell.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../src/app/[...slug]/page.tsx", import.meta.url), "utf8");
  assert.ok(article.includes("hero--thematic"));
  assert.ok(article.includes("isRepeatedNotice"));
  assert.ok(article.includes("ArticleReadingFlow"));
  assert.ok(!article.includes('className="editorial-notice"'));
  assert.ok(!article.includes('className="thematic-feature"'));
  assert.ok(!shell.includes('className="legal-review-strip"'));
  assert.ok(route.includes("isThematicSlug(slug)"));
});

test("the exact public service title appears in the red site-wide header", () => {
  const shell = readFileSync(new URL("../src/components/PageShell.tsx", import.meta.url), "utf8");
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  assert.ok(shell.includes("Единая справочная служба Москвы по жилищным вопросам"));
  assert.ok(css.includes(".site--home .topbar"));
  assert.ok(shell.includes('href="/o-proekte"'));
  assert.ok(shell.includes("Не является официальным сайтом"));
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
test("legal reading flow drops empty migration headings and editorial-only paragraphs", () => {
  const article = readFileSync(new URL("../src/components/MigratedArticle.tsx", import.meta.url), "utf8");
  assert.ok(article.includes("if (!section.length"));
  assert.ok(article.includes("isRepeatedNotice"));
  assert.ok(article.includes("legacyAnchors.find"));
  assert.ok(!article.includes("Подробное содержание этого раздела пока не подтверждено"));
  assert.ok(!article.includes('className="thematic-feature"'));
});
