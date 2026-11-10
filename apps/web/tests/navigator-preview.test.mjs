import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const groups=read("src/data/navigator-preview.ts");
const route=read("src/app/navigator-dgi/page.tsx");
const sitemap=read("src/app/sitemap.ts");
const all=Array.from({length:6},(_,i)=>JSON.parse(read("src/data/pages-"+i+".json"))).flat();
const slugs=new Set(all.map(x=>x.slug));

test("prototype can only navigate to existing migrated topic URLs",()=>{
  const existingGroupsOnly=groups.split("const scenarioTopics =")[0];
  const entries=[...existingGroupsOnly.matchAll(/slugs:\[([^\]]+)\]/g)];
  assert.equal(entries.length,7);
  const ids=[...existingGroupsOnly.matchAll(/id:"([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,7);
  const covered=new Set();
  for(const [,text] of entries){
    for(const [,slug] of text.matchAll(/"([a-z0-9-]+)"/g)){
      assert.ok(slugs.has(slug),"Unexpected new or invented public route "+slug);
      covered.add(slug);
    }
  }
  assert.equal(covered.size,19);
});

test("draft navigator is strictly inaccessible on approved public release",()=>{
  assert.ok(route.includes("if (siteIsLive) notFound();"));
  assert.ok(route.includes("index: false, follow: false"));
  assert.ok(route.includes('getNavigatorPreviewGroups()'));
  assert.ok(!sitemap.includes('add("/navigator-dgi"'));
  assert.ok(!read("src/components/PageShell.tsx").includes('href="/navigator-dgi"'));
});

test("prototype never asserts a legal rule or changes publication policy",()=>{
  assert.ok(route.includes("Новые юридические рекомендации здесь не публикуются."));
  assert.ok(route.includes("не означает юридического подтверждения её текста"));
});


test("three private scenario bundles reuse only existing content, without legal approval",()=>{
  const entries=[...groups.matchAll(/slugs:\[([^\]]+)\]/g)];
  assert.equal(entries.length,10,"7 thematic groups + 3 research-only case bundles");
  const scenarioSection=groups.split("const scenarioTopics =")[1];
  assert.ok(scenarioSection);
  const ids=[...scenarioSection.matchAll(/id:"([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(ids,["privatization-refusal","housing-registration-removal","citizen-correspondence"]);
  for(const [,slug] of scenarioSection.matchAll(/"([a-z0-9-]+)"/g)){
    if(slug==="research_only")continue;
    // Only source article IDs in slugs: [...], not new legal route/claim text.
    if(slugs.has(slug)) continue;
    assert.ok(ids.includes(slug), "Unknown scenario title or route: "+slug);
  }
  assert.ok(groups.includes('evidenceStatus:"research_only"'));
  assert.ok(route.includes("getNavigatorPreviewScenarios()"));
  assert.ok(route.includes("Проверка источников не завершена"));
  assert.ok(route.includes("Связи с конкретными решениями судов"));
  assert.ok(route.includes("if (siteIsLive) notFound();"));
  assert.ok(!sitemap.includes('add("/navigator-dgi"'));
});

test("all source candidates remain research-only, never passed into publication evidence",()=>{
  const matrix=JSON.parse(read("../../research/dgi-sprint2-source-matrix.json"));
  assert.equal(matrix.schema_version,1);
  assert.equal(matrix.publication_status,"blocked");
  assert.equal(matrix.visibility,"repository_research_only_not_website");
  assert.equal(matrix.scenarios.length,3);
  const statusFor=new Map(matrix.scenarios.map(s=>[s.id,s]));
  for(const id of ["privatization-refusal","housing-registration-removal","citizen-correspondence"]){
    assert.ok(statusFor.has(id),id+" missing");
    const row=statusFor.get(id);
    assert.ok(row.claim_candidates.length);
    for(const claim of row.claim_candidates){
      assert.equal(claim.publishable,false);
      assert.notEqual(claim.verification_status,"approved");
      assert.ok(claim.missing.length>=30);
      const seen=new Set();
      for(const source of claim.source_candidates){
        assert.match(source.url,/^https:\/\//);
        const host=new URL(source.url).hostname;
        assert.ok(host===source.authority || host.endsWith("."+source.authority));
        assert.ok(!seen.has(source.authority),"Repeated authority incorrectly counted");
        seen.add(source.authority);
      }
      assert.ok(seen.size<=3);
      if(claim.id==="general-30-days" || claim.id==="removal-contest"){
        assert.equal(seen.size,3,"Three authorities are research candidates, not legal approval");
        assert.equal(claim.verification_status,"three_independent_official_candidates_not_automatically_verified");
        for(const source of claim.source_candidates){
          if(claim.id==="general-30-days"){
            assert.ok(source.candidate_excerpt?.length>=60,"Research excerpt missing");
            assert.match(source.status,/not_live_source_gate_approved/);
          }
        }
      } else {
        assert.ok(seen.size<3,"Privatization claim lacks the third independent source");
        assert.equal(claim.verification_status,"insufficient_independent_confirmations");
      }
    }
  }
  const manifest=JSON.parse(read("../../legal-evidence/three-source-claims.json"));
  assert.deepEqual(manifest.claims,[],"Candidate excerpts are not legal publication approvals");
});
