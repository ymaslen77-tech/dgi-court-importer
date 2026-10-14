import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const pages=Array.from({length:6},(_,i)=>JSON.parse(readFileSync(
 new URL("../../apps/web/src/data/pages-"+i+".json",import.meta.url),"utf8"
))).flat();
const cases=JSON.parse(readFileSync(
 new URL("../../apps/web/src/data/legacy-cases.json",import.meta.url),"utf8"
)).cases;
test("all internal migrated links resolve to a known preserved public URL",()=>{
 const paths=new Set(pages.map(p=>p.slug?"/"+p.slug:"/"));
 for(const item of cases)paths.add("/dgi-court-cases/"+item.slug);
 let checked=0;
 const invalid=[];
 for(const page of pages)for(const block of page.blocks){
   if(block.kind!=="link")continue;
   const url=block.href||"";
   if(url.startsWith("https://"))continue;
   checked++;
   const pathname=url.split(/[?#]/)[0].replace(/\/$/,"")||"/";
   if(!paths.has(pathname))invalid.push({from:page.slug,to:url});
 }
 assert.deepEqual(invalid,[],"Broken internal URLs in recovered Webflow snapshots");
 assert.ok(checked>30,"No internal cross-links checked");
});
