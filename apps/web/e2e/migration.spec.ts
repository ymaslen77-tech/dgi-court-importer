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


test("empty original questions now navigate to a real legal guidance page", async ({page})=>{
  await page.goto("/normativnye-akty");
  const section=page.locator(".article-related-topic a[href='/funkcii-dgi']");
  await expect(section).toBeVisible();
  await section.click();
  await expect(page).toHaveURL(/\/funkcii-dgi$/);
  await expect(page.locator("h1")).toContainText("Функции");
});

test("FAQ answers and step-by-step instructions expand by mouse and keyboard",async ({page})=>{
  await page.goto("/zhaloba-na-dgi-moskvy");
  const faq=page.locator("details.article-faq").filter({has:page.locator("summary").getByText("Получите письменный отказ",{exact:true})}).first();
  await expect(faq).toBeVisible();
  await expect(faq).not.toHaveAttribute("open");
  await faq.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(faq).toHaveAttribute("open","");
  await expect(faq.locator(".article-faq-answer")).toContainText("решения ДГИ");
});

test("original question remains accessible as a disclosure heading",async ({page})=>{
  await page.goto("/renovaciya-pereselenie");
  const faq=page.locator("details.article-faq").filter({has:page.locator("summary").getByText("Нужно ли подписывать документы, если есть замечания к новой квартире?",{exact:true})}).first();
  await expect(faq).toBeVisible();
  await faq.locator("summary").click();
  await expect(faq).toHaveAttribute("open","");
  await expect(faq.locator(".article-faq-answer")).not.toBeEmpty();
});
