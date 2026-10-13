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
    const targetSlug = path.replace(/^\\/|\\/$/g, "");
    assert.ok(ids.has(`${targetSlug}#${fragment}`),
      `Broken deep link from ${page.slug}: ${block.href}`);
  }
});
