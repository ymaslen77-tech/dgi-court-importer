import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {summarizeEligibility} from "../seo-release-eligibility.mjs";
const load=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const pages=Array.from({length:6},(_,i)=>load(`apps/web/src/data/pages-${i}.json`)).flat();
const state={pages,acts:load("apps/web/src/data/housing-law-catalog.json"),services:load("apps/web/src/data/dgi-service-register.json"),guides:load("apps/web/src/data/housing-guides.json"),remediation:load("migration/housing-legal-remediation-2026-10-18.json")};
test("full SEO site launch cannot happen without signed legal editions and procedures",()=>{
 const r=summarizeEligibility(state);
 assert.equal(r.notAnOnlineOrHumanLegalSignoff,true);
 assert.equal(r.allContentLegallyApproved,false);
 assert.equal(r.indexationDecision,"BLOCKED_PENDING_VERIFIED_LEGAL_SIGNOFF");
 assert.equal(r.totalDrafts.staticPages,33);
 assert.equal(r.totalDrafts.acts,20);
 assert.equal(r.totalDrafts.services,7);
 assert.equal(r.totalDrafts.guides,18);
 assert.equal(r.eligibleDrafts.acts,0);
 assert.equal(r.eligibleDrafts.services,0);
 assert.equal(r.eligibleDrafts.staticPages,0);
 assert.equal(r.blockers.some(x=>x.type==="incomplete_topic_inventory"),true);
});
test("two Moscow acts numbered 521-PP have distinct dates and cannot be conflated",()=>{
 const r=summarizeEligibility(state);
 assert.ok(r.identityWarnings.includes("same-number-different-act-521-pp"));
 const x=state.remediation.sourceIdentityWarnings[0];
 assert.equal(x.targetAct.number,x.distinctAct.number);
 assert.notEqual(x.targetAct.date,x.distinctAct.date);
 assert.equal(x.targetAct.date,"2014-09-10");
 assert.equal(x.distinctAct.date,"2026-03-11");
 assert.equal(x.doNotMerge,true);
});
test("status cannot be inferred merely by marking one act approved",()=>{
 const clone=structuredClone(state);
 clone.acts.laws[0].currentVersionVerified=true;
 clone.acts.laws[0].publicationApproved=true;
 assert.equal(summarizeEligibility(clone).indexationDecision,"BLOCKED_PENDING_VERIFIED_LEGAL_SIGNOFF");
});
