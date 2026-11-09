import { test, expect } from "@playwright/test";

const guides = [
  "/zhaloba-na-dgi-moskvy",
  "/gosuslugi-dgi",
  "/privatizaciya-zhilya",
  "/renovaciya-pereselenie",
  "/zhilishchnyj-uchet",
];

for (const path of guides) {
  test("legal service reading hierarchy: " + path, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("main h1")).toHaveCount(1);
    const headings = page.locator("main .article-topic > h2");
    expect(await headings.count()).toBeGreaterThanOrEqual(2);
    const contents = page.locator("nav.article-contents");
    await expect(contents).toBeVisible();
    expect(await contents.locator("a").count()).toBeGreaterThanOrEqual(3);
    for (const link of await contents.locator("a").all()) {
      const href = await link.getAttribute("href");
      expect(href).toMatch(/^#[a-zA-Z0-9_-]+$/);
      await expect(page.locator(href!)).toHaveCount(1);
    }
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "No horizontal page overflow").toBeLessThanOrEqual(2);
    const font = await page.locator(".article-p").first().evaluate(element =>
      getComputedStyle(element).fontSize);
    expect(Number.parseFloat(font)).toBeGreaterThanOrEqual(14);
  });
}

test("main navigation stays available on narrow viewports without causing page overflow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: "Основные разделы" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Новости", exact: true })).toBeVisible();
  const metrics = await page.evaluate(() => {
    const nav = document.querySelector(".main-nav") as HTMLElement | null;
    return {
      width: document.documentElement.scrollWidth - window.innerWidth,
      scrollable: !!nav && nav.scrollWidth >= nav.clientWidth,
    };
  });
  expect(metrics.width).toBeLessThanOrEqual(2);
  expect(metrics.scrollable).toBe(true);
});
