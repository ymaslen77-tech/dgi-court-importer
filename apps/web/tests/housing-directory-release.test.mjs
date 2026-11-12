import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const directory = read("src/app/temy-zhilishchnogo-prava/page.tsx");
const preview = read("src/app/navigator-dgi/page.tsx");
const intake = read("src/components/AdditionalResearchIntakes.tsx");
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

test("all four added fact-only research questionnaires stay private and do not send or persist data", () => {
  assert.ok(intake.startsWith('"use client";'));
  const ids = [...intake.matchAll(/^    id: "([^"]+)",$/gm)].map(match => match[1]);
  assert.deepEqual(ids, [
    "housing-registration-removal", "dgi-no-response",
    "social-tenancy-dispute", "renovation-offer-disagreement",
  ]);
  assert.ok(preview.includes("<PrivatizationResearchIntake />"));
  assert.ok(preview.includes("<AdditionalResearchIntakes />"));
  assert.ok(intake.includes('data-research-status="research_only"'));
  for (const token of [
    "fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage",
    "document.cookie", "FormData(", 'type="file"', 'type="text"', "<textarea",
    "download", "navigator.clipboard", "window.location",
  ]) assert.ok(!intake.includes(token), "Private intake must not contain " + token);
  assert.ok(intake.includes("setAnswers({})"));
  assert.ok(intake.includes("Результат не определяет"));
});
