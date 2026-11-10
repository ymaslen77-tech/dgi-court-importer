import {test} from "node:test";
import {strict as assert} from "node:assert";
import {readFileSync} from "node:fs";

const read=(path)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
const groups=read("src/data/navigator-preview.ts");
const route=read("src/app/navigator-dgi/page.tsx");
const sitemap=read("src/app/sitemap.ts");
const all=Array.from({length:6},(_,i)=>JSON.parse(read("src/data/pages-"+i+".json"))).flat();
const slugs=new Set(all.map(x=>x.slug));

test("prototype can only navigate to existing migrated topic URLs",()=>{
  const entries=[...groups.matchAll(/slugs:\[([^\]]+)\]/g)];
  assert.equal(entries.length,7);
  const ids=[...groups.matchAll(/id:"([^"]+)"/g)].map(m=>m[1]);
  assert.equal(new Set(ids).size,7);
  const covered=new Set();
  for(const [,text] of entries){
    for(const [,slug] of text.matchAll(/"([a-z0-9-]+)"/g)){
      assert.ok(slugs.has(slug),"Unexpected new or invented public route "+slug);
      covered.add(slug);
    }
  }
  assert.equal(covered.size,19);
});

test("draft navigator is strictly inaccessible on approved public release",()=>{
  assert.ok(route.includes("if (siteIsLive) notFound();"));
  assert.ok(route.includes("index: false, follow: false"));
  assert.ok(route.includes('getNavigatorPreviewGroups()'));
  assert.ok(!sitemap.includes('add("/navigator-dgi"'));
  assert.ok(!read("src/components/PageShell.tsx").includes('href="/navigator-dgi"'));
});

test("prototype never asserts a legal rule or changes publication policy",()=>{
  assert.ok(route.includes("Новые юридические рекомендации здесь не публикуются."));
  assert.ok(route.includes("не означает юридического подтверждения её текста"));
});
