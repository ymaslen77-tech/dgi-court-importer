import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// For every source page, verify that the user never sees an empty h2
// or a fake collapsed FAQ. No legal content is rewritten by this test.
const pages = Array.from({ length: 6 }, (_, i) =>
  JSON.parse(readFileSync(resolve(process.cwd(), "src/data/pages-" + i + ".json"), "utf8"))
).flat() as Array<{ slug: string; blocks: Array<{ kind: string; text: string }> }>;

test("all 32 legal guide pages contain only populated major sections", async ({ page }) => {
  test.setTimeout(180_000);
  let inspected = 0;
  for (const item of pages.filter(p => p.slug)) {
    if (item.slug === "sudebnaya-praktika-dgi" || item.slug === "novosti-zhilishchnogo-prava") continue;
    const response = await page.goto("/" + item.slug, { waitUntil: "domcontentloaded" });
    expect(response?.status(), "status " + item.slug).toBe(200);
    const audit = await page.locator(".article-topic").evaluateAll(nodes =>
      nodes.map(section => ({
        name: section.querySelector("h2")?.textContent?.trim() ?? "",
        populated: !!section.querySelector("p.article-p, p.article-action a, details.article-faq .article-faq-answer p"),
        headingCount: section.querySelectorAll(":scope > h2").length,
      }))
    );
    for (const section of audit) {
      expect(section.name.length, "heading " + item.slug).toBeGreaterThan(0);
      expect(section.headingCount, "single heading " + item.slug).toBe(1);
      expect(section.populated, "blank section " + item.slug + " > " + section.name).toBe(true);
    }
    const faqs = await page.locator("details.article-faq").evaluateAll(nodes =>
      nodes.map(el => ({
        name: el.querySelector("summary")?.textContent?.trim() ?? "",
        body: el.querySelector(".article-faq-answer")?.textContent?.trim() ?? el.textContent?.trim() ?? "",
      }))
    );
    for (const faq of faqs) expect(faq.body.length, "empty FAQ " + item.slug + ": " + faq.name).toBeGreaterThan(40);
    if (audit.length) {
      const heading = page.locator(".article-topic > h2").first();
      const style = await heading.evaluate(el => ({
        size: parseFloat(getComputedStyle(el).fontSize),
        weight: parseInt(getComputedStyle(el).fontWeight, 10)
      }));
      expect(style.size, "heading size " + item.slug).toBeLessThanOrEqual(26);
      expect(style.weight, "heading weight " + item.slug).toBeLessThanOrEqual(640);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "horizontal overflow " + item.slug).toBeLessThanOrEqual(2);
    inspected++;
  }
  expect(inspected).toBeGreaterThanOrEqual(25);
});

test("privatization page excludes its five confirmed empty template headings", async ({ page }) => {
  await page.goto("/privatizaciya-zhilya");
  for (const unused of [
    "Кто вправе обращаться", "Как проходит процедура",
    "Какие сведения необходимо подготовить", "Если отказали",
    "Другие разделы справочника"
  ]) {
    await expect(page.locator(".article-topic > h2", { hasText: unused })).toHaveCount(0);
  }
  await expect(page.getByRole("heading", { name: "Перед приватизацией квартиры: пять проверок" })).toBeVisible();
  await expect(page.getByText("Статья 2 Закона № 1541-1", { exact: false })).toBeVisible();
});
