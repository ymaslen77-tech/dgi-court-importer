import { test } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const component = read("src/components/PrivatizationResearchIntake.tsx");
const page = read("src/app/navigator-dgi/page.tsx");
const sitemap = read("src/app/sitemap.ts");
const css = read("src/app/globals.css");

test("privatization intake is integrated only under the private noindex and production 404 route", () => {
  assert.ok(page.includes('import { PrivatizationResearchIntake }'));
  assert.ok(page.includes("<PrivatizationResearchIntake />"));
  assert.ok(page.includes("if (siteIsLive) notFound();"));
  assert.ok(page.includes("index: false, follow: false"));
  assert.ok(!sitemap.includes('add("/navigator-dgi"'));
  assert.ok(component.includes('data-research-status="research_only"'));
});

test("intake contains five source-neutral factual questions and no automated procedural outcome", () => {
  const ids = [...component.matchAll(/\n    id: "([^"]+)",/g)].map((m) => m[1]);
  assert.deepEqual(ids, ["request", "response", "housing", "participants", "grounds"]);
  assert.ok(component.includes("юридическая оценка, выбор судебной процедуры, сроков и документа здесь не выполняются"));
  assert.ok(component.includes("Это не определение права на приватизацию"));
  assert.ok(!/\b(?:иск|жалобу)\s+следует\s+подать\b/i.test(component));
  assert.ok(!component.includes("window.location"));
});

test("input is privacy minimised: client-local radio choices only, no transmission or identifiers", () => {
  assert.ok(component.startsWith('"use client";'));
  assert.ok(component.includes('type="radio"'));
  for (const forbidden of [
    "fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage",
    "document.cookie", "FormData(", 'type="file"', 'type="text"', "<textarea", "download",
  ]) assert.ok(!component.includes(forbidden), "Forbidden transfer, persistence or personal field: " + forbidden);
  assert.ok(component.includes("useState<Partial<Record<QuestionId, Answer>>>({})"));
  assert.ok(component.includes("setAnswers({})"));
});

test("keyboard focus and 320px layout are present in closed intake styles", () => {
  assert.ok(css.includes(".navigator-intake-options input:focus-visible"));
  assert.ok(css.includes(".navigator-intake-question { min-width: 0"));
  assert.ok(css.includes("@media (max-width: 380px) { .navigator-intake"));
});
