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
  expect(guides).toHaveLength(11);
  expect(supplements).toHaveLength(6);
});

for (const guide of guides) {
  test(`staging legal route renders and stays noindex: ${guide.slug}`, async ({ page }) => {
    const response = await page.goto(`/${guide.slug}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(guide.title);
    await expect(page.getByText("Редакционный черновик · не прошёл юридическую приёмку")).toBeVisible();
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
    await expect(page.locator(".housing-supplement .housing-review-label")).toContainText("редакционный черновик");
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
 await page.getByRole("link",{name:/редакционный каталог 16 жилищных нормативных актов/}).click();
 await expect(page).toHaveURL(/\/spravochnik-zhilishchnogo-zakonodatelstva-moskvy$/);
 await expect(page.locator("h1")).toContainText("Жилищное законодательство Москвы");
 await expect(page.locator(".housing-law-entry")).toHaveCount(16);
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
 await expect(page.getByText("Ни один акт пока не отмечен как юридически проверенный для публикации.")).toBeVisible();
 const over=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
 expect(over).toBeLessThanOrEqual(2);
});

test("catalog explains eight reference-only revision dates without asserting legal approval",async ({page})=>{
 await page.goto("/spravochnik-zhilishchnogo-zakonodatelstva-moskvy");
 await expect(page.locator(".housing-law-revision")).toHaveCount(8);
 await expect(page.locator('[id="521-pp"]')).toContainText("05.05.2026");
 await expect(page.locator('[id="111-pp"]')).toContainText("18.08.2026");
 await expect(page.locator('[id="491-rf"]')).toContainText("26.09.2026");
 await expect(page.locator('[id="521-pp"]')).toContainText("не консолидированный текст");
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});
