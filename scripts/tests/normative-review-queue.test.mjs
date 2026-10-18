import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const source=JSON.parse(readFileSync(new URL("../../migration/cms-inventory.json",import.meta.url),"utf8"));
const review=JSON.parse(readFileSync(new URL("../../migration/normative-review-queue.json",import.meta.url),"utf8"));
test("every unverified Webflow legal document has a current-text review task",()=>{
 const inventory=source.collections.find(x=>x.slug==="dgi-legal-documents").items;
 assert.equal(inventory.length,4);
 assert.equal(review.overallStatus,"NOT_APPROVED");
 assert.deepEqual(review.documents.map(x=>x.slug).sort(),inventory.map(x=>x.slug).sort());
 for(const item of review.documents){
   const record=inventory.find(x=>x.slug===item.slug);
   assert.equal(item.status,"primary_current_text_required");
   assert.equal(item.source,record.metadata.officialUrl);
   assert.ok(item.evidence.startsWith("https://"));
   assert.ok(item.finding.length>30);
 }
});
