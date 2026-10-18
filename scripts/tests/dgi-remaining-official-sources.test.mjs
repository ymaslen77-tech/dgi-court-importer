import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const backlog=read("migration/dgi-remaining-official-source-queue.json");
const draft=read("apps/web/src/data/dgi-service-register.json");
const approvedIds=new Set(draft.services.map(x=>x.id));
test("unverified P2 issues cannot appear as approved DGI government services",()=>{
 assert.equal(backlog.status,"research_only");
 assert.equal(backlog.publicationApproved,false);
 assert.equal(backlog.items.length,4);
 for(const item of backlog.items){
  assert.equal(item.notAServiceAssertion,true);
  assert.equal(item.authorityPending,true);
  assert.equal(item.procedurePending,true);
  assert.ok(!approvedIds.has(item.id));
  assert.ok(item.reason.length>100);
  const uri=new URL(item.officialLead);
  assert.equal(uri.protocol,"https:");
  assert.ok(["www.mos.ru","rosreestr.gov.ru"].includes(uri.hostname));
 }
});
