import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const pages = Array.from({length:6},(_,i)=>json(`../../apps/web/src/data/pages-${i}.json`)).flat();
const links = json("../../apps/web/src/data/missing-topic-destinations.json");

test("all 52 previously empty H2 subjects link to reviewed on-site routes or official sources",()=>{
 const sitePaths = new Set(pages.map(page=>page.slug ? "/"+page.slug : "/"));
 let total=0;
 for(const page of pages)for(let i=0;i<page.blocks.length;i++) {
   const h=page.blocks[i],next=page.blocks[i+1];
   if(h.kind!=="h2" || (next && next.kind!=="h2"))continue;
   total++;
   const href=links[page.slug]?.[h.text];
   assert.ok(href,`Unanswered topic: ${page.slug} / ${h.text}`);
   assert.notEqual(href, "/"+page.slug,"No self-link in an empty section");
   if(href.startsWith("/")) {
     assert.ok(sitePaths.has(href), `Missing internal target: ${href}`);
   } else {
     const url=new URL(href);
     assert.equal(url.protocol,"https:");
     assert.ok(["mos.ru","www.mos.ru","stroi.mos.ru","vestnikmoscow.mos.ru","rosreestr.gov.ru"].includes(url.hostname),
       `Unapproved external target: ${url.hostname}`);
   }
 }
 assert.equal(total,52);
 assert.equal(Object.values(links).reduce((n, section)=>n+Object.keys(section).length,0),52);
});

test("FAQ uses native accessible disclosures and preserves the existing answer blocks",()=>{
 const component=readFileSync(new URL("../../apps/web/src/components/MigratedArticle.tsx",import.meta.url),"utf8");
 const css=readFileSync(new URL("../../apps/web/src/app/globals.css",import.meta.url),"utf8");
 assert.match(component,/<details className="article-faq"/);
 assert.match(component,/<summary>/);
 assert.match(component,/content\.map\(\(entry, index\)/);
 assert.match(component,/TopicDestination/);
 assert.match(component,/SourceHeadingId/);
 assert.match(component,/const needsAnswer/);
 assert.match(component,/getMigratedPage\(href\.slice\(1\)\)/);
 assert.match(css,/\.article-faq summary:focus-visible/);
 assert.match(css,/\.article-related-topic/);
});

test("published content still has no auto-generated legal claims or FAQ schema",()=>{
 const component=readFileSync(new URL("../../apps/web/src/components/MigratedArticle.tsx",import.meta.url),"utf8");
 assert.doesNotMatch(component,/"@type"\s*:\s*"FAQPage"/);
 assert.match(component,/Подробное содержание этого раздела пока не подтверждено/);
 assert.match(component,/noopener noreferrer/);
});
