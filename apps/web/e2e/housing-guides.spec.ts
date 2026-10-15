import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const { guides, supplements } = JSON.parse(
  readFileSync(resolve(process.cwd(), "src/data/housing-guides.json"), "utf8"),
) as {
  guides: Array<{ slug: string; title: string; related: string[]; sources: Array<{ url: string }> }>;
  supplements: Array<{ slug: string; sources: Array<{ url: string }> }>;
};

test("the housing guidance inventory is complete for this delivery", () => {
  expect(guides).toHaveLength(15);
  expect(supplements).toHaveLength(6);
});

for (const guide of guides) {
  test(`staging legal route renders and stays noindex: ${guide.slug}`, async ({ page }) => {
    const response = await page.goto(`/${guide.slug}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(guide.title);
    await expect(page.getByText("Перед обращением проверьте действующие правила")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.locator(".housing-guide section")).toHaveCount(7);
    await expect(page.locator(".housing-guide ol > li")).toHaveCount(4);
    const anchors = await page.locator(".housing-source-list a").evaluateAll(els =>
      els.map(el => (el as HTMLAnchorElement).href),
    );
    expect(anchors.sort()).toEqual(guide.sources.map(s => s.url).sort());
    for (const slug of guide.related) {
      await expect(page.locator(`.housing-related a[href="/${slug}"]`)).toHaveCount(1);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, `Horizontal overflow in guide ${guide.slug}`).toBeLessThanOrEqual(2);
  });
}

for (const item of supplements) {
  test(`existing landing page shows staging-only supplement: ${item.slug}`, async ({ page }) => {
    const response = await page.goto(`/${item.slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator(".housing-supplement")).toHaveCount(1);
    await expect(page.locator(".housing-supplement .housing-review-label")).toContainText("Пошаговая инструкция");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    const urls = await page.locator(".housing-supplement .housing-source-list a").evaluateAll(els =>
      els.map(el => (el as HTMLAnchorElement).href),
    );
    expect(urls.sort()).toEqual(item.sources.map(s => s.url).sort());
  });
}

test("new guide links lead to an existing local destination", async ({ page }) => {
  const guide = guides[0];
  await page.goto(`/${guide.slug}`);
  const related = page.locator(".housing-related a").first();
  const link = await related.getAttribute("href");
  expect(link).toMatch(/^\/[a-z0-9-]+$/);
  await related.click();
  await expect(page).toHaveURL(new RegExp(`${link}$`));
  await expect(page.locator("h1")).toHaveCount(1);
});

test("normative acts catalog is accessible from source page and remains noindex",async ({page})=>{
 const response=await page.goto("/normativnye-akty");
 expect(response?.status()).toBe(200);
 await page.getByRole("link",{name:/справочник жилищных законов и постановлений/}).click();
 await expect(page).toHaveURL(/\/spravochnik-zhilishchnogo-zakonodatelstva-moskvy$/);
 await expect(page.locator("h1")).toContainText("Жилищное законодательство Москвы");
 await expect(page.locator(".housing-law-entry")).toHaveCount(19);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
 await expect(page.getByText("Перед использованием проверьте актуальную редакцию документа.")).toBeVisible();
 const over=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(over).toBeLessThanOrEqual(2);
});

test("catalog explains eight reference-only revision dates without asserting legal approval",async ({page})=>{
 await page.goto("/spravochnik-zhilishchnogo-zakonodatelstva-moskvy");
 await expect(page.locator(".housing-law-revision")).toHaveCount(8);
 await expect(page.locator('[id="521-pp"]')).toContainText("05.05.2026");
 await expect(page.locator('[id="111-pp"]')).toContainText("18.08.2026");
 await expect(page.locator('[id="491-rf"]')).toContainText("26.09.2026");
 await expect(page.locator('[id="521-pp"]')).toContainText("Прежнее приложение 14 утратило силу");
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});


test("public-facing pages do not expose developer or migration messages", async ({ page }) => {
 const routes = [
  "/",
  "/sudebnaya-praktika-dgi",
  "/dgi-court-cases/decision-02-4422-2026-additional-10",
  "/priznanie-maloimushchim-dlya-zhilishchnogo-ucheta",
  "/spravochnik-zhilishchnogo-zakonodatelstva-moskvy",
  "/zhilishchnaya-ochered",
 ];
 for (const path of routes) {
  const response = await page.goto(path);
  expect(response?.status(), path).toBe(200);
  const visibleText = await page.locator("body").innerText();
  expect(visibleText, path).not.toMatch(/webflow|next\.?js|\bCMS\b|редакционный черновик|предварительная версия|текст перенесён|staging|миграци[яи]|релиз|сборка сайта|техническая проверка/iu);
 }
});

test("DGI services register renders all four source-backed services without legal approval",async({page})=>{
  const response=await page.goto("/reestr-gosuslug-dgi");
  expect(response?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".housing-law-entry")).toHaveCount(4);
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content",/noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator(".housing-law-entry .housing-law-status")).toHaveCount(4);
  const urls=await page.locator(".housing-law-entry a[href^='https://']").evaluateAll(els=>els.map(x=>(x as HTMLAnchorElement).hostname));
  expect(urls.every(host=>host==="www.mos.ru"||host==="mos.ru")).toBe(true);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(2);
});

test("the new DGI registry links to the detailed archive-rights legal route",async({page})=>{
  await page.goto("/reestr-gosuslug-dgi");
  await page.getByRole("link",{name:/Пошаговая правовая инструкция/}).first().click();
  await expect(page).toHaveURL(/\/arhivnye-prava-na-zhile-do-1998$/);
  await expect(page.locator("h1")).toContainText("Архивные права");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});
