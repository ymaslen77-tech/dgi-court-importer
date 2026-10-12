import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dataRoot = new URL("../src/data/", import.meta.url);
const load = (name) => JSON.parse(readFileSync(new URL(name,dataRoot),"utf8"));
const inventory = load("webflow-pages.json").pages;
const content = Array.from({length:7},(_,i)=>load("snapshot-"+String(i+1).padStart(2,"0")+".json")).flatMap(x=>x.pages);

test("31 original Webflow SEO routes are preserved and unique",() => {
  assert.equal(inventory.length,31);
  const slugs = inventory.map(x=>x.slug);
  assert.equal(new Set(slugs).size,slugs.length);
  assert.ok(!slugs.includes("internal-housing-design"));
  assert.ok(!slugs.some(x=>x.startsWith("detail_")));
  for (const x of inventory) {
    assert.ok(x.slug && x.sourcePageId && x.title && x.description);
    assert.equal(x.sourceUrl,"https://dgimos.webflow.io/"+x.slug);
  }
});

test("every ready URL has structured text and original Webflow headings",() => {
  const snapshots = new Map(content.map(x=>[x.slug,x]));
  assert.equal(snapshots.size,31);
  for (const x of inventory.filter(x=>x.status==="ready")) {
    const snapshot = snapshots.get(x.slug);
    assert.ok(snapshot,"Missing snapshot: "+x.slug);
    assert.ok(snapshot.blocks.length>=6,"Not enough blocks: "+x.slug);
    assert.ok(snapshot.blocks.some(b=>["h1","h2"].includes(b.kind)),"Missing heading: "+x.slug);
    assert.ok(snapshot.blocks.every(b=>["h1","h2","h3","p","li","link"].includes(b.kind)),"Unknown kind: "+x.slug);
  }
});

test("special court route is separate from SEO content snapshots",() => {
  assert.ok(inventory.every(x=>x.slug!==""&&x.slug!=="sudebnaya-praktika-dgi"));
});
