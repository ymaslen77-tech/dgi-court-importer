import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

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
