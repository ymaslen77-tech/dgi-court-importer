import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read = p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
const shell=read("src/components/PageShell.tsx");
const config=read("next.config.ts");
const css=read("src/app/globals.css");
test("unapproved legal release must clearly identify itself as independent and under review",()=>{
 assert.match(shell, /!siteIsLive && \(/);
 assert.match(shell, /Независимый справочный проект/);
 assert.match(shell, /Правовые материалы проходят проверку актуальности/);
 assert.match(shell, /Это не официальный сайт ДГИ Москвы/);
 assert.match(shell,/https:\/\/www\.mos\.ru\/dgi\//);
 assert.match(shell, /className="legal-review-strip"/);
 assert.match(css,/\.legal-review-strip/);
 assert.match(css, /@media\(max-width:640px\)/);
});
test("legal review beta remains excluded from search engines until an independent release approval",()=>{
 assert.match(config, /SITE_RELEASE_APPROVED === "yes"/);
 assert.match(config, /SITE_CUTOVER === "true"/);
 assert.match(config, /noindex, nofollow, noarchive/);
});
