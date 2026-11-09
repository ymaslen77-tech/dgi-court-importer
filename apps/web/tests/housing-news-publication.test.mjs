import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load = path => readFileSync(new URL(path, import.meta.url), "utf8");
const rows = JSON.parse(load("../src/data/housing-news.json"));

test("News source and destination are real and unique", () => {
  const ids = new Set();
  const urls = new Set();
  for (const row of rows) {
    assert.match(row.slug, /^[a-z0-9-]{15,125}$/);
    assert.equal(ids.has(row.slug), false, "Duplicate published slug");
    ids.add(row.slug);
    const url = new URL(row.sourceUrl);
    assert.equal(url.protocol, "https:");
    assert.ok(["mos.ru", "mosreg.ru", "garant.ru"].some(h => url.hostname === h || url.hostname.endsWith("." + h)));
    assert.equal(urls.has(url.href), false, "Duplicate source");
    urls.add(url.href);
    assert.ok(["Москва", "Московская область"].includes(row.region));
    assert.ok(row.title.length >= 20 && row.title.length <= 180);
    assert.ok(row.summary.length >= 80 && row.summary.length <= 600);
    assert.ok(Date.parse(row.sourcePublishedAt) < Date.now());
    assert.ok(Date.parse(row.publishedAt) < Date.now());
    assert.ok(Array.isArray(row.sections) && row.sections.length >= 3);
    for (const section of row.sections) {
      assert.ok(section.heading.length >= 5);
      assert.ok(section.paragraphs.every(p => p.length >= 70 && p.length <= 1200));
    }
  }
});
test("News index, detail pages and navigation exist", () => {
  const nav = load("../src/components/PageShell.tsx");
  const page = load("../src/app/novosti-zhilishchnogo-prava/page.tsx");
  const detail = load("../src/app/novosti-zhilishchnogo-prava/[slug]/page.tsx");
  assert.match(nav, /\/novosti-zhilishchnogo-prava/);
  assert.match(page, /listHousingNews/);
  assert.match(detail, /getHousingNews/);
  assert.match(detail, /article\.sourceUrl/);
  assert.match(detail, /siteIsLive \?/);
  assert.match(page, /siteIsLive \?/);
});
