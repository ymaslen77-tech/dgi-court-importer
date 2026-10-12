import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const path = new URL("../src/data/", import.meta.url);
const inventory = JSON.parse(readFileSync(new URL("webflow-pages.json",path),"utf8")).pages;
const content = JSON.parse(readFileSync(new URL("webflow-content.json",path),"utf8")).pages;

test("URL slugs are unique and SEO metadata is present",() => {
 const slugs = inventory.map(x=>x.slug);
 assert.equal(new Set(slugs).size,slugs.length);
 for(const x of inventory){assert.ok(x.slug && x.sourcePageId && x.title && x.description);}
});

test("ready routes have content derived from Webflow",() => {
 const contents = new Map(content.map(x=>[x.slug,x]));
 for(const x of inventory.filter(x=>x.status==="ready")){
   assert.ok(contents.has(x.slug),"missing snapshot "+x.slug);
   assert.ok(contents.get(x.slug).blocks.length>0,"empty snapshot "+x.slug);
 }
});

test("redirect safety: no duplicate homepage or court search route",() => {
 assert.ok(inventory.every(x=>x.slug!=="sudebnaya-praktika-dgi" && x.slug!==""));
});
