import {test} from "node:test";import assert from "node:assert/strict";import{readFileSync}from "node:fs";
const src=p=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
const audit=JSON.parse(src("migration/housing-legal-remediation-2026-10-18.json"));
const page=src("apps/web/src/app/specializirovannyy-zhilishchnyy-fond/page.tsx");
const nav=src("apps/web/src/components/PageShell.tsx");
test("federal 131-FZ and specialized housing research is cited but never marked legally accepted",()=>{
 assert.equal(audit.federalOfficial2026Research.officialPublication,"https://publication.pravo.gov.ru/document/0001202605020016");
 assert.equal(audit.federalOfficial2026Research.currentEditionVerified,false);
 for(const id of ["specialized-fund","orphans"]){const x=audit.missingOrIncompleteTopics.find(y=>y.id===id);assert.equal(x.publicationApproved,false);assert.equal(x.legalSignoff,false);assert.equal(x.coverage,"draft_beta_statutory_overview");assert.equal(x.evidence.length,3);}
 assert.match(page,/siteIsLive\) notFound\(\)/);
 assert.match(page,/index:false,follow:false/);
 assert.match(page,/статьёй 8 Федерального закона №159-ФЗ/);
 assert.match(nav,/specializirovannyy-zhilishchnyy-fond/);
});
