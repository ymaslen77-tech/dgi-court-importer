import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const src=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const timeline=JSON.parse(src("migration/communal-rooms-legal-timeline-2026-10-18.json"));
const audit=JSON.parse(src("migration/housing-legal-remediation-2026-10-18.json"));
const page=src("apps/web/src/app/osvobodivshayasya-komnata-v-kommunalnoy-kvartire/page.tsx");
const nav=src("apps/web/src/components/PageShell.tsx");

test("communal-room amendment chain distinguishes primary sources and unverified latest edition",()=>{
 assert.equal(timeline.status,"partial_primary_source_verified_not_current_consolidated_edition");
 assert.equal(timeline.legallyApproved,false);
 assert.equal(timeline.publicationApproved,false);
 assert.equal(timeline.amendment759.point7_11.finding.includes("30 рабочих дней"),true);
 assert.equal(timeline.amendment759.point7_24.finding.includes("30 рабочих дней"),true);
 assert.equal(timeline.amendment759.point7_41.finding.includes("30 рабочих дней"),true);
 assert.equal(new URL(timeline.coreActs[3].officialPublication).hostname,"vestnikmoscow.mos.ru");
 assert.equal(timeline.coreActs[4].sourceStatus,"secondary_copy_located_official_full_text_still_needed");
 assert.equal(timeline.constitutionalCourt.officialPublication,"https://publication.pravo.gov.ru/document/0001202404240001");
 assert.equal(timeline.constitutionalCourt.publicationApproved,false);
 assert.ok(timeline.remaining.length>=5);
});
test("housing legal gap remains open after beta source publication",()=>{
 const a=audit.missingOrIncompleteTopics.find(x=>x.id==="communal-rooms");
 assert.ok(a);
 assert.equal(a.coverage,"partial_primary_source_beta_guidance");
 assert.equal(a.publicationApproved,false);
 assert.equal(a.legalSignoff,false);
 assert.equal(a.primaryResearchSlug,"osvobodivshayasya-komnata-v-kommunalnoy-kvartire");
 const e=audit.officialEvidence.find(x=>x.id==="759-pp-2026-communal");
 assert.equal(e.currentConsolidatedEditionVerified,false);
 assert.equal(e.publicationApproved,false);
 assert.ok(e.confirmedFacts.length>=4);
});
test("communal room article is nonindexed and disappears when public legal cutover is approved",()=>{
 assert.match(page,/siteIsLive\) notFound\(\)/);
 assert.match(page,/index: false, follow: false/);
 assert.match(page,/№759-ПП/);
 assert.match(page,/30 рабочих дней/);
 assert.match(page,/№20-П/);
 assert.match(page,/не подтверждена/);
 assert.match(nav,/!siteIsLive \? \[\{ href: "\/reestr-gosuslug-dgi"/);
 assert.match(nav,/osvobodivshayasya-komnata-v-kommunalnoy-kvartire/);
});
