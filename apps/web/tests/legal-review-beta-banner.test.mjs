import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const shell=read("src/components/PageShell.tsx");
const config=read("next.config.ts");
const proxy=read("src/proxy.ts");
const css=read("src/app/globals.css");
test("independent legal notice and official sources live in the footer, not a page-wide banner",()=>{
 assert.match(shell, /Независимый информационно-правовой справочник/);
 assert.match(shell, /Не является официальным сайтом или подразделением ДГИ Москвы/);
 assert.match(shell, /Материалы носят справочный характер/);
 assert.match(shell,/https:\/\/www\.mos\.ru\/dgi\//);
 assert.match(shell, /className="footer-disclaimer"/);
 assert.ok(!shell.includes('className="legal-review-strip"'));
 assert.match(css,/\.footer-disclaimer/);
});
test("legal review beta remains excluded from search engines until an independent release approval",()=>{
 assert.doesNotMatch(config, /key: "X-Robots-Tag"/);
 assert.match(proxy, /SITE_RELEASE_APPROVED === "yes"/);
 assert.match(proxy, /SITE_CUTOVER === "true"/);
 assert.match(proxy, /noindex, nofollow, noarchive/);
});
