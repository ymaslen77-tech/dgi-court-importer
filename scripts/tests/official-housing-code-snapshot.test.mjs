import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const load=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const catalog=load("apps/web/src/data/housing-law-catalog.json");
const matrix=load("migration/housing-legal-remediation-2026-10-18.json");
const component=readFileSync(new URL("../../apps/web/src/components/HousingLawCatalog.tsx",import.meta.url),"utf8");

test("dated official housing-code snapshot is shown without false current-law approval",()=>{
 const law=catalog.laws.find(x=>x.id==="housing-code");
 const evidence=matrix.officialEvidence.find(x=>x.id==="housing-code-official-moscow-mirror-2026-05-02");
 assert.ok(law&&evidence);
 assert.equal(law.officialSnapshot.editionAsOf,"2026-05-02");
 assert.equal(law.officialSnapshot.fullCurrentEditionVerified,false);
 assert.equal(law.approved,false);
 assert.equal(law.currentVersionVerified,false);
 assert.equal(law.officialSnapshot.url,evidence.url);
 assert.equal(new URL(evidence.url).hostname,"www.mos.ru");
 assert.equal(evidence.publicationApproved,false);
 assert.equal(evidence.currentConsolidatedEditionVerified,false);
 assert.match(component,/officialSnapshot\.warning/);
 assert.match(component,/officialSnapshot\.url/);
});
test("independent research document may not mark one of 20 acts approved",()=>{
 assert.equal(catalog.laws.length,20);
 assert.equal(matrix.actChecks.length,20);
 assert.equal(matrix.actChecks.filter(x=>x.publicationApproved).length,0);
 assert.equal(matrix.publicReleaseAllowed,false);
});
