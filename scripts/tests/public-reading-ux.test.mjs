import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");
const pageFiles = Array.from({ length: 6 }, (_, i) =>
  JSON.parse(read("apps/web/src/data/pages-" + i + ".json"))).flat();
const source = read("apps/web/src/components/MigratedArticle.tsx");
const css = read("apps/web/src/app/globals.css");
const shell = read("apps/web/src/components/PageShell.tsx");

test("all migrated guides keep source blocks; restructuring happens at render time", () => {
  assert.equal(pageFiles.length, 33);
  assert.match(source, /groupSections\(body, page\.slug\)/);
  assert.match(source, /sections\.map\(section =>/);
  assert.match(source, /ArticleReadingFlow blocks=\{section\.blocks\}/);
  assert.match(source, /article-contents/);
  assert.match(source, /legacyAnchors\.find/);
  assert.match(source, /aria-labelledby=\{section\.id\}/);
  for (const page of pageFiles) {
    assert.equal(typeof page.slug, "string");
    assert.ok(page.blocks.every(block => typeof block.text === "string"), page.slug);
    // Legal explanation is not mass-truncated or rewritten in a migration.
    assert.ok(page.blocks.length > 0, page.slug);
  }
});

test("shared navigation and reading typography remain consistent", () => {
  for (const slug of ["zhilishchnyj-uchet", "sudebnaya-praktika-dgi", "novosti-zhilishchnogo-prava"]) {
    assert.ok(shell.includes(slug));
  }
  for (const rule of [
    ".article-contents", ".article-topic--steps", ".site .main-nav",
    ".site .article .article-p", ".site .hero--thematic h1",
    "prefers-reduced-motion", "overflow-x: auto",
  ]) assert.ok(css.includes(rule), rule);
});
