import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

test("Yandex Webmaster verification is the exact static Next.js public HTML file", () => {
  const contents=readFileSync(new URL("../public/yandex_6ade8e55ebfc38d1.html",import.meta.url),"utf8");
  assert.match(contents,/<meta http-equiv="Content-Type" content="text\/html; charset=UTF-8">/);
  assert.match(contents,/<body>Verification: 6ade8e55ebfc38d1<\/body>/);
  assert.equal((contents.match(/Verification: 6ade8e55ebfc38d1/g)||[]).length,1);
});

test("robots allow ownership proof without opening unreviewed legal pages", () => {
  const robots=readFileSync(new URL("../src/app/robots.ts",import.meta.url),"utf8");
  assert.match(robots, /allow: "\/yandex_6ade8e55ebfc38d1\.html"/);
  assert.match(robots, /disallow: "\/"/);
  assert.match(robots, /siteIsLive/);
});
