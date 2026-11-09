import { test, expect } from "@playwright/test";

const cases = [
  { slug: "snyatie-s-zhilishchnogo-ucheta-moskva", title: "Запросить решение о снятии с жилищного учёта", kind: "housing" },
  { slug: "otkaz-v-privatizacii-kvartiry", title: "Жалоба на отказ в предоставлении услуги приватизации", kind: "privatization" },
  { slug: "pereraschet-zhku-moskva", title: "Обращение о качестве коммунальных услуг и проверке начислений", kind: "utility" },
  { slug: "vymorochnoe-imushchestvo-moskva", title: "Заявление нотариусу о принятии наследства", kind: "inheritance" },
  { slug: "vymorochnoe-imushchestvo-kvartira-moskva", title: "Заявление нотариусу о принятии наследства", kind: "inheritance" },
  { slug: "avariynoe-zhile-moskva", title: "Заявление об оценке состояния жилья межведомственной комиссией", kind: "emergency" },
  { slug: "renovaciya-pereselenie", title: "Замечания к предложенной квартире по реновации", kind: "renovation" },
  { slug: "zashchita-prav-sobstvennika-mkd", title: "Запрос сведений о решениях собрания собственников МКД", kind: "mkd" },
] as const;

for (const item of cases) {
  test("narrow specialist document form: " + item.slug, async ({ page }) => {
    const response = await page.goto("/" + item.slug);
    expect(response?.status()).toBe(200);
    const form = page.getByRole("region", { name: item.title });
    await expect(form).toBeVisible();
    const save = form.getByRole("button", { name: "Скачать .txt" });
    await expect(save).toBeDisabled();

    await form.getByLabel("Адресат", { exact: true }).fill("Правомочный адресат по теме");
    await form.getByLabel("ФИО заявителя").fill("Тестовый Заявитель");
    await form.getByLabel("Почтовый адрес для ответа").fill("г. Москва, тестовый адрес");
    await form.getByLabel("Дата документа").fill("2026-11-08");
    const objectLabel = form.locator("label").filter({ has: page.locator("input") })
      .filter({ hasText: /Учетное дело|Адрес квартиры|Адрес помещения|Сведения о наследственном|Адрес и вид объекта|Адрес предлагаемой|Адрес МКД/ });
    await objectLabel.locator("input").fill("Тестовый объект");
    await form.getByLabel("Факты, даты и подтверждения").fill("Сведения по материалам заявителя.");
    await form.getByLabel("Ваше требование").fill("Рассмотреть обращение и представить мотивированный ответ.");

    if (item.kind === "privatization") {
      await form.getByLabel("Место жительства заявителя").fill("Москва");
      await form.getByLabel("Контактный телефон").fill("+7 495 000-00-00");
      await form.getByLabel("Орган или должностное лицо, принявшее решение").fill("ДГИ Москвы");
    }
    if (item.kind === "inheritance") {
      await form.getByLabel("ФИО наследодателя").fill("Наследодатель");
      await form.getByLabel("Дата смерти").fill("2026-09-01");
      await form.getByLabel("Место открытия наследства").fill("Москва");
      await form.getByLabel("Основание наследования (по закону или завещанию)").fill("по закону");
    }

    await expect(save).toBeEnabled();
    await form.getByRole("button", { name: "Показать текст" }).click();
    await expect(form.getByLabel("Подготовленный текст")).toHaveValue(/Рассмотреть обращение и представить мотивированный ответ/);
    await expect(form.getByText(/Правовая основа:/)).toBeVisible();
    const [file] = await Promise.all([page.waitForEvent("download"), save.click()]);
    expect(file.suggestedFilename()).toMatch(/\.txt$/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  });
}

test("MКД information request does not claim 59-FZ 30 day regime", async ({ page }) => {
  await page.goto("/zashchita-prav-sobstvennika-mkd");
  const form = page.getByRole("region", { name: "Запрос сведений о решениях собрания собственников МКД" });
  await expect(form).toContainText("а не универсальный 30-дневный срок по № 59-ФЗ");
  await expect(form.locator('a[href="https://www.consultant.ru/document/cons_doc_LAW_547918/"]')).toHaveCount(1);
});
