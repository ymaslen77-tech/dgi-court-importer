import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const courtCatalog = JSON.parse(read("src/data/verified-court-static.json"));

test("existing official court catalog stays available to the public page", () => {
  assert.equal(courtCatalog.length, 26, "Unexpected change to pre-existing curated catalog");
  assert.equal(new Set(courtCatalog.map(x => x.slug)).size, courtCatalog.length);
  assert.equal(new Set(courtCatalog.map(x => x.case_number)).size, courtCatalog.length);
  for (const act of courtCatalog) {
    assert.equal(act.source_checked, true, act.case_number);
    assert.ok(act.privacy_checked === true || act.privacy_screen_passed === true, act.case_number);
    assert.match(act.pdf_sha256, /^[0-9a-f]{64}$/, act.case_number);
    assert.match(act.full_text_sha256, /^[0-9a-f]{64}$/, act.case_number);
    assert.ok(act.full_text.length >= 4000, act.case_number);
    assert.match(act.official_url, /^https:\/\/([a-z0-9-]+\.)*(sudrf\.ru|mos-gorsud\.ru|vsrf\.ru)\//i);
  }
  const server = read("src/data/verified-courts.ts");
  const page = read("src/app/sudebnaya-praktika-dgi/page.tsx");
  assert.match(server, /return curatedCases\.filter\(row => isOfficialPublishedCase\(row\)/);
  assert.match(page, /await searchVerifiedCourtActs\(""\)/);
  assert.match(page, /<VerifiedCourtExplorer initialItems=\{initialItems\}/);
});

test("client-side search cannot erase server-rendered cases when API fails", () => {
  const component = read("src/components/VerifiedCourtExplorer.tsx");
  assert.match(component, /if \(!query\.trim\(\)\) return;/);
  assert.match(component, /setItems\(initialItems\);/);
  assert.doesNotMatch(component, /setItems\(\[\]\);\s*setError/);
  assert.match(component, /Поиск временно недоступен/);
  assert.match(component, /setItems\(initialItems\);\s*setError\(""\)/);
});
