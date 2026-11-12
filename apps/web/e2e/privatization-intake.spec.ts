import { test, expect } from "@playwright/test";

test("private refusal intake records facts and resets without recommending a legal procedure", async ({ page }) => {
  const response = await page.goto("/navigator-dgi", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  const intake = page.locator("section.navigator-intake");
  await expect(intake).toHaveAttribute("data-research-status", "research_only");
  await expect(intake.locator("fieldset")).toHaveCount(5);
  await expect(intake.getByText("Заполнено вопросов: 0 из 5")).toBeVisible();
  const summary = intake.locator(".navigator-intake-summary");
  await expect(summary).toHaveCount(0);

  await intake.locator("fieldset").first().locator("label").first().click();
  await expect(intake.getByText("Заполнено вопросов: 1 из 5")).toBeVisible();
  await expect(summary).toBeVisible();
  await expect(summary).toContainText("Зафиксированные ответы (без правовой оценки)");
  await expect(summary).toContainText("Это не определение права на приватизацию");

  await intake.getByRole("button", { name: "Очистить ответы" }).click();
  await expect(intake.getByText("Заполнено вопросов: 0 из 5")).toBeVisible();
  await expect(summary).toHaveCount(0);
  await expect(intake.locator('input[type="radio"]:checked')).toHaveCount(0);
  await expect(intake.getByRole("button", { name: "Очистить ответы" })).toBeDisabled();
});

test("private refusal intake supports keyboard and narrow-to-wide layouts", async ({ page }) => {
  for (const width of [320, 390, 768, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/navigator-dgi", { waitUntil: "domcontentloaded" });
    const intake = page.locator("section.navigator-intake");
    const first = intake.locator('input[type="radio"]').first();
    await first.focus();
    await expect(first).toBeFocused();
    await page.keyboard.press("Space");
    await expect(first).toBeChecked();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "Intake overflow at " + width + "px").toBeLessThanOrEqual(2);
  }
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});
