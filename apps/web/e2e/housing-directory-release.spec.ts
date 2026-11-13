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


test("five native private research questionnaires remain closed to the public",async({page})=>{
  await page.goto("/navigator-dgi",{waitUntil:"domcontentloaded"});
  const panels=page.locator("details.navigator-preview-fact");
  await expect(panels).toHaveCount(5);
  await expect(panels.locator("fieldset")).toHaveCount(21);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
