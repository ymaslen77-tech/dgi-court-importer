import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {buildExtraDgiDrafts} from "../lib/build-extra-dgi-drafts.mjs";
const file=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
test("Payload CMS schema snapshot is exact and separate from website database",()=>{
 const s=file("db/cms/payload-schema-2026-10-16.sql");
 const names=[...s.matchAll(/^CREATE TABLE public\.([a-z0-9_]+) \(/gm)].map(x=>x[1]);
 assert.equal(names.length,18);
 assert.ok(names.includes("editorial_entries"));
 assert.ok(names.includes("_editorial_entries_v"));
 assert.ok(names.includes("court_references"));
 assert.ok(names.includes("webflow_cms_review"));
 assert.ok(names.includes("staff_users"));
 assert.ok(names.includes("payload_migrations"));
 assert.doesNotMatch(s,/CREATE TABLE public\.court_act_documents/);
 assert.doesNotMatch(s,/INSERT INTO|password:|postgresql:\/\//);
});
test("all 45 supplemental guides, legal documents, services are reproducible private drafts",()=>{
 const d=buildExtraDgiDrafts();
 assert.equal(d.length,45);
 assert.equal(new Set(d.map(x=>x.slug)).size,45);
 assert.equal(d.filter(x=>x.slug.startsWith("normativ-")).length,20);
 assert.equal(d.filter(x=>x.slug.startsWith("gosusluga-dgi-")).length,7);
 assert.equal(d.filter(x=>!x.slug.startsWith("normativ-")&&!x.slug.startsWith("gosusluga-dgi-")).length,18);
 for(const item of d){
  assert.ok(item.title.length>=8);
  assert.ok(item.seoTitle.length>=20);
  assert.ok(item.blocks.length>=3);
  assert.ok(item.sourceUrls.every(x=>x.url.startsWith("https://")));
 }
 const importer=file("apps/cms/src/scripts/import-extra-dgi-drafts.ts");
 assert.match(importer,/CMS_PRIVATE_IMPORT!=="yes"/);
 assert.match(importer,/CMS_IMPORT_CONFIRM!=="yes"/);
 assert.match(importer,/_status:"draft"/);
 assert.match(importer,/reviewState:"needs-review"/);
});
