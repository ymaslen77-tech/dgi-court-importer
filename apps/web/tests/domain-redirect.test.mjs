import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const config=readFileSync(new URL("../next.config.ts",import.meta.url),"utf8");
test("canonical www redirect preserves route paths",()=>{
  assert.match(config, /value: "www\.dgi-pravo\.ru"/);
  assert.match(config, /destination: "https:\/\/dgi-pravo\.ru\/:path\*"/);
  assert.match(config, /permanent: true/);
  assert.match(config, /source: "\/:path\*"/);
});
