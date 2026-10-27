import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

/** Current restricted-release acceptance checks. Historical archive tests
 * are kept separately but must not require retired banners or unverified cases. */
const pages=Array.from({length:6},(_,i)=>JSON.parse(
  readFileSync(resolve(process.cwd(),`src/data/pages-${i}.json`),"utf8")
)).flat() as Array<{slug:string,title:string}>;

test("historical URL inventory is internally consistent",()=>{
  expect(pages).toHaveLength(33);
  const slugs=pages.map(p=>p.slug);
  expect(new Set(slugs).size).toBe(slugs.length);
});

test("restricted staging does not leak sitemaps or unreviewed drafts",async({request})=>{
  const [robots,sitemap,draft]=await Promise.all([
    request.get("/robots.txt"),request.get("/sitemap.xml"),
    request.get("/housing-law-news/not-published")
  ]);
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Disallow: /");
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain("<loc>");
  expect(draft.status()).toBe(404);
});

for(const item of pages){
  const path=item.slug?"/"+item.slug:"/";
  test("restricted preview has a coherent legal page: "+path,async({page})=>{
    const response=await page.goto(path,{waitUntil:"domcontentloaded"});
    expect(response?.status(),path).toBe(200);
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page.locator('meta[name="robots"]').first()).toHaveAttribute("content",/noindex/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
    const heading=await page.locator("main h1").first().innerText();
    expect(heading.trim().length).toBeGreaterThan(10);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,"Unexpected horizontal scrolling: "+path).toBeLessThanOrEqual(2);
  });
}

test("footer and navigation are present without obsolete release banners",async({page})=>{
  await page.goto("/");
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("navigation",{name:"Основные разделы"})).toBeVisible();
  await expect(page.locator("footer")).toHaveCount(1);
  await expect(page.locator(".legal-review-strip")).toHaveCount(0);
});
