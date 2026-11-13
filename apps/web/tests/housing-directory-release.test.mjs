import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const directory = read("src/app/temy-zhilishchnogo-prava/page.tsx");
const preview = read("src/app/navigator-dgi/page.tsx");
const homepage = read("src/app/page.tsx");
const shell = read("src/components/PageShell.tsx");
const sitemap = read("src/app/sitemap.ts");
const data = read("src/data/navigator-preview.ts");

test("public thematic catalog links only previously released article and form inventory", () => {
  assert.ok(directory.includes("getNavigatorPreviewGroups()"));
  assert.ok(directory.includes("getNavigatorPreviewCrossTopicPages()"));
  assert.ok(directory.includes("getNavigatorPreviewForms()"));
  assert.ok(data.includes("getMigratedPage(slug)"));
  assert.ok(directory.includes("Это не автоматический"));
  assert.ok(!directory.includes("<PrivatizationResearchIntake"));
  assert.ok(!directory.includes("<AdditionalResearchIntakes"));
  assert.ok(!directory.includes("/navigator-dgi"));
});

test("new source-neutral directory is public only with existing site release gate", () => {
  assert.ok(directory.includes("robots: { index: siteIsLive, follow: siteIsLive }"));
  assert.ok(directory.includes("alternates: siteIsLive"));
  assert.ok(sitemap.includes('add("/temy-zhilishchnogo-prava"'));
  assert.ok(sitemap.includes("if (!siteIsLive) return [];"));
  assert.ok(homepage.includes('href="/temy-zhilishchnogo-prava"'));
  assert.ok(shell.includes('href="/temy-zhilishchnogo-prava"'));
  assert.ok(preview.includes("if (siteIsLive) notFound();"));
  assert.ok(preview.includes("index: false, follow: false"));
  assert.ok(!sitemap.includes('add("/navigator-dgi"'));
});


test("closed five-scenario factual input remains nonlegal and never linked from public catalog",()=>{
  assert.ok(preview.includes("getNavigatorResearchFactQuestionnaires()"));
  assert.ok(preview.includes('data-research-status="research_only"'));
  assert.ok(preview.includes('type="radio"'));
  assert.ok(preview.includes("if (siteIsLive) notFound();"));
  assert.ok(!directory.includes("getNavigatorResearchFactQuestionnaires"));
  assert.ok(!directory.includes("navigator-dgi"));
  assert.ok(!directory.includes("PrivatizationResearchIntake"));
});

test("exact source-addressed publication contract matches all public TSX, metadata and legacy title files",()=>{
  const rootFile=(path)=>readFileSync(new URL("../../../"+path,import.meta.url));
  const policy=rootFile("scripts/validate_three_source_publication.py").toString("utf8");
  const locked={
    "apps/web/src/app/temy-zhilishchnogo-prava/page.tsx":"ce8d6061bf9e257248e535f04dc938f4c26373e6",
    "apps/web/src/app/page.tsx":"1112dc00b788e30b3ba3ca7f0793519009c432f5",
    "apps/web/src/components/PageShell.tsx":"483a052e7e319b99fbb0a0fcefdb43031000887e",
    "apps/web/src/app/sitemap.ts":"a027e04e4787abc4de85b506c3d287dcbf90f4d4",
    "apps/web/src/app/situatsii/[scenarioId]/page.tsx":"0b3272cd90f75487456ecf6e9c1beacb3ccdcabe",
    "apps/web/src/components/VerifiedScenarioIntake.tsx":"6ea2fde2c8e97290c0ce4acffac5b85cba8ffd33",
    "apps/web/src/data/navigator-preview.ts":"56fc91849a136582a1b646adc63e9e96ef31cfe1",
    "apps/web/src/data/owner-released-legacy-pages.json":"d4e9d259a6904baf64ec9b72fd25693710edcd00",
    "apps/web/src/data/pages-0.json":"5e17431a8bf454d056aedb2ce10fd020966b9c97",
    "apps/web/src/data/pages-1.json":"476401f34dc3814ca98f1b40368a866e4f30ffdf",
    "apps/web/src/data/pages-2.json":"643857193af0e72d72e51d3133f6e73755879e92",
    "apps/web/src/data/pages-3.json":"9e4c65b124db99ba6293a51ce73facdf1de5a53a",
    "apps/web/src/data/pages-4.json":"8d975d98bcb5c43bf1bb72a2bee46bcbe4667316",
    "apps/web/src/data/pages-5.json":"d8a6480db234c7472addad3916e48995cf968fc1",
  };
  for(const [path,digest] of Object.entries(locked)){
    const data=rootFile(path);
    const gitBlob=createHash("sha1")
      .update("blob "+data.length+"\0","utf8").update(data).digest("hex");
    assert.equal(gitBlob,digest,"Unreviewed change in "+path);
    assert.ok(policy.includes('"'+digest+'"'),"Policy does not pin "+path);
  }
});

test("only individually verified scenarios reach the new dynamic route and sitemap",()=>{
  const published=JSON.parse(read("src/data/dgi-verified-scenarios.json"));
  const page=read("src/app/situatsii/[scenarioId]/page.tsx");
  const generator=read("src/components/VerifiedScenarioIntake.tsx");
  const evidence=JSON.parse(readFileSync(new URL("../../../legal-evidence/three-source-claims.json",import.meta.url),"utf8"));
  assert.equal(published.scenarios.length,3);
  assert.deepEqual(published.scenarios.map(s=>s.id).sort(),
    ["dgi-no-response","housing-registration-removal","social-tenancy-dispute"]);
  assert.ok(directory.includes("verifiedScenarios.scenarios.map"));
  assert.ok(sitemap.includes("verifiedScenarios.scenarios"));
  assert.ok(page.includes("getScenario(scenarioId)"));
  assert.ok(page.includes("robots:{index:siteIsLive,follow:siteIsLive}"));
  assert.ok(!generator.includes("fetch("));
  assert.ok(!generator.includes("localStorage"));
  assert.ok(!generator.includes("sessionStorage"));
  assert.ok(!generator.includes("dangerouslySetInnerHTML"));
  assert.ok(!page.includes("dangerouslySetInnerHTML"));
  assert.equal(evidence.claims.filter(c=>c.file==="apps/web/src/data/dgi-verified-scenarios.json").length,48);
});
