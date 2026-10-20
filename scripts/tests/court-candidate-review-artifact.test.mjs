import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const wf=readFileSync(new URL("../../.github/workflows/moscow-housing-court-catalog.yml",import.meta.url),"utf8");
const rows=readFileSync(new URL("../../data/court-catalog.jsonl",import.meta.url),"utf8").trim().split("\n").map(JSON.parse);
test("weekly ingest cannot silently publish unreviewed candidate data",()=>{
 assert.match(wf,/WRITE_INDEX:.*github\.event_name == 'workflow_dispatch' && inputs\.write_catalog == true/);
 assert.match(wf,/if: env\.WRITE_INDEX == 'true'/);
 assert.match(wf,/--write\)/);
 assert.match(wf,/moscow-housing-court-candidates-for-legal-review/);
 assert.match(wf,/path: data\/court-catalog\.jsonl/);
 assert.match(wf,/retention-days: 14/);
 assert.match(wf,/verification.*case_metadata_only/);
 assert.match(wf,/obj\["act_reviewed"\] is False/);
});
test("existing court catalog stores only metadata and not invented outcomes",()=>{
 const fields=["act_reviewed","category","court","dataset","dgi_party","id","instance_group","number","official_case_url","topics","uid","verification"].sort();
 assert.ok(rows.length>0);
 for(const row of rows){
   assert.deepEqual(Object.keys(row).sort(),fields);
   assert.equal(row.act_reviewed,false);
   assert.equal(row.verification,"case_metadata_only");
   assert.ok(row.official_case_url.startsWith("https://"));
 }
});
