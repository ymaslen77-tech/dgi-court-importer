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
  assert.equal(covered.size,23);
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
  const scenarioSection=groups.split("const scenarioTopics =")[1]?.split("const crossTopicSlugs =")[0];
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
      assert.equal(seen.size,3,"Three source candidates required even during research");
      assert.equal(claim.verification_status,"three_independent_official_candidates_not_automatically_verified");
      if(claim.id==="general-30-days"){
        for(const source of claim.source_candidates){
          assert.ok(source.candidate_excerpt?.length>=60,"Research excerpt missing");
          assert.match(source.status,/not_live_source_gate_approved/);
        }
      }
      if(claim.id==="court-dispute-exists"){
        const prosecutor=claim.source_candidates.find(s=>s.authority==="genproc.gov.ru");
        assert.match(prosecutor.status,/not_same_procedural_scope/);
        assert.ok(claim.missing.includes("Нет трёх тождественных подтверждений"));
      }
    }
  }
  const manifest=JSON.parse(read("../../legal-evidence/three-source-claims.json"));
  assert.ok(manifest.claims.every(claim=>
    claim.file!=="research/dgi-sprint2-source-matrix.json"),
    "Research-only candidate URLs must never be legal publication approvals");
  const sourceBacked=manifest.claims.filter(claim=>
    claim.file==="apps/web/src/data/dgi-verified-scenarios.json");
  assert.equal(sourceBacked.length,48,
    "Only three separately audited scenarios may publish");
  assert.deepEqual([...new Set(sourceBacked.map(c=>c.record_id))].sort(),
    ["dgi-no-response","housing-registration-removal","social-tenancy-dispute"]);
});

test("every one of 33 owner-released legacy pages is inventoried exactly once, including home",()=>{
  const approved=JSON.parse(read("src/data/owner-released-legacy-pages.json")).approved_existing_slugs;
  assert.equal(approved.length,33);
  const normalizedSlugs=new Set(approved);
  assert.equal(normalizedSlugs.size,33);
  const thematic=groups.split("const scenarioTopics =")[0];
  const thematicSlugs=[...thematic.matchAll(/slugs:\[([^\]]+)\]/g)].flatMap(match=>
    [...match[1].matchAll(/"([a-z0-9-]+)"/g)].map(x=>x[1]));
  assert.equal(thematicSlugs.length,23);
  const supplement=groups.split("const crossTopicSlugs =")[1]?.split("] as const")[0];
  assert.ok(supplement,"Supplemental cross-topic directory missing");
  const otherSlugs=[...supplement.matchAll(/"([a-z0-9-]+)"/g)].map(x=>x[1]);
  assert.equal(otherSlugs.length,9);
  const inventoried=[...thematicSlugs,...otherSlugs];
  assert.equal(new Set(inventoried).size,32,"No duplicated legacy link across groups");
  assert.deepEqual([...new Set(["",...inventoried])].sort(),[...normalizedSlugs].sort(),
    "33 existing URLs, including home, must be represented without invented routes");
});

test("ten linked form destinations exist and match the already-rendered builder kinds",()=>{
  const source=read("src/components/MigratedArticle.tsx");
  const genericBuilder=read("src/components/LegalDocumentBuilder.tsx");
  const specializedBuilder=read("src/components/SpecializedDocumentBuilder.tsx");
  const formSection=groups.split("const existingFormEntrypoints =")[1]?.split("] as const")[0];
  assert.ok(formSection,"Ten existing form entrypoints missing");
  const forms=[...formSection.matchAll(/\{ id: "([^"]+)", title: "([^"]+)", slug: "([^"]+)", kind: "([^"]+)" \}/g)];
  assert.equal(forms.length,10);
  const ids=new Set(),slugsWithForms=new Set();
  for(const match of forms) {
    const [,id,title,slug,kind]=match;
    assert.equal(id,kind);
    assert.ok(!ids.has(id),"Form kind repeated: "+id);
    ids.add(id);
    assert.ok(slugs.has(slug),"Form points to unlisted page: "+slug);
    slugsWithForms.add(slug);
    const isGeneric=["request","service-complaint","civil-objection"].includes(kind);
    const component=isGeneric?"LegalDocumentBuilder":"SpecializedDocumentBuilder";
    assert.ok((isGeneric?genericBuilder:specializedBuilder).includes(title),"Form label differs from component: "+id);
    const escapedSlug=slug.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const escapedKind=kind.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    assert.match(source,new RegExp('page\\.slug === "'+escapedSlug+'"[^\\n]*<'+component+' kind="'+escapedKind+'"'),
      "Linked article does not render the named form: "+id);
  }
  assert.equal(ids.size,10);
  assert.equal(slugsWithForms.size,10);
});

test("directory and form catalog remain closed, nonindexable and not a legal decision engine",()=>{
  assert.ok(route.includes("getNavigatorPreviewCrossTopicPages()"));
  assert.ok(route.includes("getNavigatorPreviewForms()"));
  assert.ok(route.includes("каталог функций, а не подбор правильного документа"));
  assert.ok(route.includes("if (siteIsLive) notFound();"));
  assert.ok(!sitemap.includes('add("/navigator-dgi"'));
});


test("five research-only questionnaires are static and cannot publish a legal recommendation",()=>{
  const questionData=groups.split("const researchFactQuestionnaires =")[1]?.split("export function getNavigatorResearchFactQuestionnaires")[0];
  assert.ok(questionData);
  const ids=[...questionData.matchAll(/^    id: "([^"]+)",$/gm)].map(x=>x[1]);
  assert.deepEqual(ids,["privatization-refusal","housing-registration-removal","dgi-no-response","social-tenancy-dispute","renovation-offer-disagreement"]);
  const prompts=[...questionData.matchAll(/title: "/g)];
  assert.ok(prompts.length>=26,"Expected five factual questionnaires and their items");
  assert.ok(route.includes("getNavigatorResearchFactQuestionnaires()"));
  assert.ok(route.includes('data-research-status="research_only"'));
  assert.ok(route.includes('type="radio"'));
  assert.ok(route.includes("if (siteIsLive) notFound();"));
  assert.ok(!sitemap.includes('add("/navigator-dgi"'));
  assert.ok(!route.includes("onSubmit="));
  assert.ok(!route.includes('type="submit"'));
});
