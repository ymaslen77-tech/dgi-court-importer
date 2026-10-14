import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";

const manifest=JSON.parse(readFileSync(
  resolve(process.cwd(),"../../migration/webflow-seo-manifest.json"),"utf8"
)) as {pages:Array<{path:string}>};
const court=JSON.parse(readFileSync(
  resolve(process.cwd(),"src/data/legacy-cases.json"),"utf8"
)) as {cases:Array<{slug:string}>};

test("staging search engines are blocked",async ({request})=>{
  const robots=await request.get("/robots.txt");
  expect(robots.ok()).toBeTruthy();
  expect(await robots.text()).toMatch(/Disallow:\s*\//i);
  const sitemap=await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).not.toContain("<loc>");
});
test("skip link works by keyboard",async ({page})=>{
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeInViewport();
});
for(const {path} of manifest.pages){
  test("static page is accessible and responsive: "+path,async ({page})=>{
    const response=await page.goto(path,{waitUntil:"domcontentloaded"});
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("meta[name=robots]")).toHaveAttribute("content",/noindex/);
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    const overflow=await page.evaluate(()=>(
      document.documentElement.scrollWidth-window.innerWidth
    ));
    expect(overflow,"Horizontal overflow at "+path).toBeLessThanOrEqual(2);
  });
}
for(const {slug} of court.cases){
  test("legacy case remains noindex: "+slug,async ({page})=>{
    const response=await page.goto("/dgi-court-cases/"+slug);
    expect(response?.status()).toBe(200);
    await expect(page.locator("meta[name=robots]")).toHaveAttribute("content",/noindex/);
    await expect(page.getByText("Результат рассмотрения")).toBeVisible();
    await expect(page.getByText("Не подтверждён",{exact:true}).first()).toBeVisible();
    const overflow=await page.evaluate(()=>(
      document.documentElement.scrollWidth-window.innerWidth
    ));
    expect(overflow,"Horizontal overflow at legacy case "+slug).toBeLessThanOrEqual(2);
  });
}
test("unreviewed CMS slug does not leak",async ({page})=>{
  const result=await page.goto("/housing-law-news/not-published");
  expect(result?.status()).toBe(404);
});
