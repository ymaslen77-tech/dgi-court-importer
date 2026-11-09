import { test, expect } from "@playwright/test";

// These views intentionally test protected staging. No draft is promoted to
// production, no release flags are flipped, and no search bot is contacted.
const routes = [
  "/",
  "/privatizaciya-zhilya",
  "/socialnyj-naem",
  "/pereraschet-zhku-moskva",
  "/zayavlenie-v-dgi-moskvy",
  "/novosti-zhilishchnogo-prava",
  "/sudebnaya-praktika-dgi",
];
const widths = [320, 360, 390, 768, 1024, 1280, 1920];

for (const path of routes) {
  test("responsive content on " + path, async ({ page }) => {
    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 500 ? 820 : 900 });
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path + " @ " + width).toBe(200);
      await expect(page.locator("main h1"), path + " @ " + width).toHaveCount(1);
      await expect(page.getByRole("navigation", {name:"Основные разделы"})).toBeVisible();
      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const main = document.querySelector("main") as HTMLElement;
        return {
          viewport: window.innerWidth,
          scrollWidth: root.scrollWidth,
          mainWidth: main.getBoundingClientRect().width,
          hasViewport: !!document.querySelector('meta[name="viewport"]'),
        };
      });
      expect(metrics.hasViewport, "Missing mobile viewport on " + path).toBe(true);
      expect(metrics.mainWidth, "Collapsed main content on " + path).toBeGreaterThan(0);
      expect(
        metrics.scrollWidth - metrics.viewport,
        "Unexpected horizontal overflow on " + path + " at " + width + "px",
      ).toBeLessThanOrEqual(2);
    }
  });
}

test("internal navigation and anchors remain usable with keyboard", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeVisible();
  await expect(page.locator("#topics")).toHaveCount(1);
  await page.getByRole("link", { name: "Приватизация", exact: true }).first().click();
  await expect(page).toHaveURL(/\/privatizaciya-zhilya$/);
  await expect(page.locator("main h1")).toHaveCount(1);
});

test("legal draft form remains interactive across browser engines", async ({ page }) => {
  await page.goto("/zayavlenie-v-dgi-moskvy");
  const form = page.getByRole("region", {name:"Подготовить обращение в ДГИ"});
  await expect(form).toBeVisible();
  const download = form.getByRole("button", { name: "Скачать .txt" });
  await expect(download).toBeDisabled();
  await form.getByLabel("Адресат (орган, должностное лицо)").fill("Департамент городского имущества");
  await form.getByLabel("Заявитель: ФИО").fill("Тестовый заявитель");
  await form.getByLabel("Почтовый адрес заявителя").fill("Москва, проверочный адрес");
  await form.getByLabel("Дата документа").fill("2026-11-09");
  await form.getByLabel("Предмет документа").fill("Запрос сведений");
  await form.getByLabel("Факты, даты, номера решений и доводы").fill("Установленные заявителем обстоятельства.");
  await form.getByLabel("Что просите сделать").fill("Прошу рассмотреть вопрос и дать ответ.");
  await expect(download).toBeEnabled();
  await form.getByRole("button", { name:"Показать текст" }).click();
  await expect(form.getByLabel("Подготовленный текст")).toHaveValue(/Установленные заявителем обстоятельства/);
});

test("published news and court index remain readable without client JavaScript", async ({ browser }) => {
  const context = await browser.newContext({baseURL:"http://127.0.0.1:3000",javaScriptEnabled:false});
  try {
    const page = await context.newPage();
    for(const path of ["/novosti-zhilishchnogo-prava","/sudebnaya-praktika-dgi"]) {
      const response = await page.goto(path, { waitUntil:"domcontentloaded" });
      expect(response?.status()).toBe(200);
      await expect(page.locator("main h1")).toHaveCount(1);
      const links = page.locator("main a[href^='/" + (path.includes("novosti") ? "novosti-zhilishchnogo-prava/" : "sudebnaya-praktika-dgi/") + "']");
      expect(await links.count(), "Server-rendered accessible links on " + path).toBeGreaterThan(0);
    }
  } finally { await context.close(); }
});
