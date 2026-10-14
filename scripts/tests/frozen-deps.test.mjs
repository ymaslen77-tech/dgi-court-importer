import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("monorepo CI uses a committed frozen pnpm dependency tree",()=>{
 const lock=readFileSync(new URL("../../pnpm-lock.yaml",import.meta.url),"utf8");
 assert.match(lock,/lockfileVersion:/);
 assert.ok(lock.includes("@playwright/test"));
 for(const path of ["website-ci.yml","browser-staging-qa.yml"]){
   const workflow=readFileSync(new URL("../../.github/workflows/"+path,import.meta.url),"utf8");
   assert.ok(workflow.includes("pnpm install --frozen-lockfile"),path);
   assert.ok(!workflow.includes("pnpm install --no-frozen-lockfile"),path);
   assert.ok(!workflow.includes("contents: write"),path);
 }
});
