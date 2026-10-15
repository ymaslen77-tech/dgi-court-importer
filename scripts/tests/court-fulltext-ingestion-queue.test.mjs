import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const sources=read("apps/web/src/data/official-court-candidates.json");
const queue=read("migration/court-fulltext-ingestion-queue-2026-10-15.json");
const legal=read("migration/court-legal-acceptance-queue-2026-10-15.json");
test("sixteen exact source records feed fulltext import without inventing decisions",()=>{
 assert.equal(sources.length,16);
 assert.equal(queue.items.length,16);
 assert.equal(queue.totals.observedCassationActs,8);
 assert.equal(queue.totals.metadataOnly,8);
 assert.equal(queue.totals.fullTextStoredInSiteDatabase,0);
 assert.equal(queue.publicationApproved,false);
 const observed=[...legal.cassationDispositionObservations,...legal.additionalCassationDeterminations];
 assert.equal(queue.items.filter(x=>x.textSourceStatus==="official_cassation_act_found_text_not_locally_imported").length,8);
 assert.equal(queue.items.filter(x=>x.textSourceStatus==="official_case_metadata_only").length,8);
 for(const entry of queue.items){
  const source=sources.find(x=>"official:"+x.id===entry.stableKey);
  assert.ok(source);
  assert.equal(entry.caseNumber,source.number);
  assert.equal(entry.officialSource,source.official_case_url);
  assert.equal(entry.exactFullTextCaptured,false);
  assert.equal(entry.storedInSitePostgres,false);
  assert.equal(entry.publicationApproved,false);
  assert.equal(entry.documentSourceSha256,null);
  const act=observed.find(x=>x.cassationNumber===entry.caseNumber||x.caseNumber===entry.caseNumber);
  if(act){
    assert.equal(entry.decisionDate,act.date);
    assert.equal(entry.uid,act.uid);
    assert.ok(entry.proposedSlug?.includes(act.date));
  }else{
    assert.equal(entry.decisionDate,null);
    assert.equal(entry.proposedSlug,null);
  }
 }
});
