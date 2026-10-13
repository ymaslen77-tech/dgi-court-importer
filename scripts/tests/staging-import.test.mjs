import { strict as assert } from "node:assert";
import { test } from "node:test";
import { prepareMigrationData, officialCourtUrl } from "../lib/prepare-migration-data.mjs";

test("33 unique site pages and safe court metadata", () => {
  const data=prepareMigrationData();
  assert.equal(data.counts.pages,33);
  assert.equal(data.counts.legacyUnverifiedCases,22);
  assert.ok(data.counts.officialCandidates >= 16);
  assert.equal(new Set(data.pages.map(x=>x.slug)).size,data.pages.length);
  assert.equal(new Set(data.cases.map(x=>x.key)).size,data.cases.length);
  assert.ok(data.cases.every(x=>x.actVerified===false && !Object.hasOwn(x,"outcome")));
});
test("official court links accept only allowed HTTPS hosts", () => {
  assert.ok(officialCourtUrl("https://2kas.sudrf.ru/modules.php?id=1"));
  for(const url of ["http://2kas.sudrf.ru/","https://sudrf.ru.evil.test/",
    "https://evil.test/","https://sudrf.ru@evil.test/","javascript:alert(1)"])
    assert.equal(officialCourtUrl(url),null);
});
test("legacy titles never assert unchecked decisions", () => {
  const legacy=prepareMigrationData().cases.filter(x=>x.key.startsWith("webflow:"));
  assert.equal(legacy.length,22);
  assert.ok(legacy.every(x=>x.officialUrl===null && x.verification==="review"));
  assert.ok(legacy.every(x=>!Object.hasOwn(x,"title") && !Object.hasOwn(x,"summary")));
});
