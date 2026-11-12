import { test, expect } from "@playwright/test";

test("source-neutral public catalog has seven themes, known materials and ten form links", async ({ page }) => {
  const response = await page.goto("/temy-zhilishchnogo-prava", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Темы жилищного справочника", level: 1 })).toBeVisible();
  await expect(page.locator(".housing-public-directory-group")).toHaveCount(7);
  await expect(page.locator(".housing-public-directory-group li a")).toHaveCount(23);
  await expect(page.locator(".navigator-preview-directory").first().locator("a")).toHaveCount(9);
  await expect(page.locator(".navigator-preview-directory").nth(1).locator("a")).toHaveCount(10);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('a[href="/navigator-dgi"]')).toHaveCount(0);
});

test("topic catalog is reachable from homepage and keyboard navigable on mobile and desktop", async ({ page }) => {
  await page.goto("/");
  const catalog = page.locator('a[href="/temy-zhilishchnogo-prava"]').first();
  await expect(catalog).toBeVisible();
  for (const width of [320, 360, 390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/temy-zhilishchnogo-prava", { waitUntil: "domcontentloaded" });
    const link = page.locator(".housing-public-directory-group a").first();
    await link.focus();
    await expect(link).toBeFocused();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "Catalog overflow at " + width + "px").toBeLessThanOrEqual(2);
  }
});

test("all five research-only fact intakes are in private preview, reset independently", async ({ page }) => {
  await page.goto("/navigator-dgi", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".navigator-intake");
  await expect(cards).toHaveCount(5);
  await expect(cards.filter({ has: page.locator('input[type="radio"]') })).toHaveCount(5);
  const second = cards.nth(1);
  await second.locator('input[type="radio"]').first().check();
  await expect(second.getByText("Заполнено вопросов: 1 из 4")).toBeVisible();
  await expect(cards.first().getByText("Заполнено вопросов: 0 из 5")).toBeVisible();
  await second.getByRole("button", { name: "Очистить ответы" }).click();
  await expect(second.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(second.getByText("Заполнено вопросов: 0 из 4")).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
