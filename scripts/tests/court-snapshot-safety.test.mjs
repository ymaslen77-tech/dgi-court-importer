import { test } from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const original = readFileSync(new URL("../../data/court-catalog.jsonl", import.meta.url),"utf8")
  .trim().split(/\r?\n/).map(line=>JSON.parse(line));
const snapshot = JSON.parse(readFileSync(
  new URL("../../apps/web/src/data/official-court-candidates.json",import.meta.url),"utf8"
));

test("public court candidate snapshot matches the 16 official metadata source rows",()=>{
  assert.equal(snapshot.length,16);
  assert.deepEqual(snapshot,original);
  for(const item of snapshot){
    const url=new URL(item.official_case_url);
    assert.equal(url.protocol,"https:");
    assert.equal(url.hostname,"2kas.sudrf.ru");
    assert.match(url.searchParams.get("case_id")||"",/^\d+$/);
    assert.match(url.searchParams.get("case_uid")||"",/^[0-9a-f-]{36}$/i);
    assert.equal(item.verification,"case_metadata_only");
    assert.equal(item.act_reviewed,false);
    assert.equal("outcome" in item,false);
    assert.equal("parties" in item,false);
  }
});

test("Next.js candidate catalog cannot trace the whole repository into its runtime",()=>{
  const source=readFileSync(new URL("../../apps/web/src/data/courts.ts",import.meta.url),"utf8");
  assert.ok(source.includes('import officialSnapshot from "./official-court-candidates.json"'));
  assert.doesNotMatch(source,/COURT_CATALOG_PATH|readFileSync|process\.cwd|node:fs/);
});

test("legacy general appeals search URL cannot be presented as a confirmed case source",()=>{
  const source=readFileSync(new URL("../../apps/web/src/app/sudebnaya-praktika-dgi/page.tsx",import.meta.url),"utf8");
  const dbSource=readFileSync(new URL("../../apps/web/src/data/court-search.ts",import.meta.url),"utf8");
  assert.ok(source.includes("VerifiedCourtExplorer"));
  assert.ok(!source.includes("CourtExplorer cases="));
  assert.ok(!source.includes("legacyCases"));
  assert.ok(!source.includes("listOfficialCandidates"));
  assert.ok(dbSource.includes("services\\/cases\\/"));
});
