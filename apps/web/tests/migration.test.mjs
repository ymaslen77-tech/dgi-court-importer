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
