import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("public Next.js config keeps defensive headers and proxy gates preview indexing",()=>{
 const config=readFileSync(new URL("../../apps/web/next.config.ts",import.meta.url),"utf8");
 const proxy=readFileSync(new URL("../../apps/web/src/proxy.ts",import.meta.url),"utf8");
 for(const h of ["X-Content-Type-Options","Referrer-Policy",
   "X-Frame-Options","Permissions-Policy"])assert.ok(config.includes(h));
 assert.ok(!config.includes("unsafe-inline"));
 assert.ok(proxy.includes("X-Robots-Tag"));
 assert.match(proxy,/SITE_RELEASE_APPROVED === "yes"/);
 assert.match(proxy,/SITE_CUTOVER === "true"/);
 assert.match(proxy,/noindex, nofollow, noarchive/);
 assert.doesNotMatch(config,/key: "X-Robots-Tag"/);
});
