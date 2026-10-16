import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
test("public Next.js config provides baseline defensive headers",()=>{
 const source=readFileSync(new URL("../../apps/web/next.config.ts",import.meta.url),"utf8");
 for(const h of ["X-Content-Type-Options","Referrer-Policy",
   "X-Frame-Options","Permissions-Policy","X-Robots-Tag"])assert.ok(source.includes(h));
 assert.ok(!source.includes("unsafe-inline"));
 assert.match(source,/SITE_RELEASE_APPROVED === "yes"/);
 assert.match(source,/SITE_CUTOVER === "true"/);
 assert.match(source,/noindex, nofollow, noarchive/);
});
