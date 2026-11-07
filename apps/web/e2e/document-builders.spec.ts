import { test, expect } from "@playwright/test";

const routes = [
  { path: "/zayavlenie-v-dgi-moskvy", title: "Подготовить обращение в ДГИ" },
  { path: "/zhaloba-na-dgi-moskvy", title: "Подготовить жалобу на предоставление госуслуги" },
  { path: "/isk-o-vyselenii-socialnyy-naem", title: "Подготовить возражения на гражданский иск" },
] as const;

for (const route of routes) {
  test("editable source-backed document draft: " + route.path, async ({ page }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);
    const builder = page.getByRole("region", { name: route.title });
    await expect(builder).toBeVisible();
    const download = builder.getByRole("button", { name: "Скачать .txt" });
    await expect(download).toBeDisabled();

    await builder.getByLabel("Заявитель: ФИО", { exact: true }).or(
      builder.getByLabel("Ответчик: ФИО", { exact: true }),
    ).fill("Иванов Иван");
    await builder.getByLabel("Почтовый адрес заявителя").fill("Москва, тестовый адрес для проверки интерфейса");
    await builder.getByLabel("Дата документа").fill("2026-11-08");
    await builder.getByLabel("Факты, даты, номера решений и доводы").fill("Факты и доказательства, внесённые пользователем.");
    await builder.getByLabel("Что просите сделать").fill("Рассмотреть доводы и дать мотивированный ответ.");

    if (route.path === "/isk-o-vyselenii-socialnyy-naem") {
      await builder.getByLabel("Наименование суда").fill("Районный суд");
      await builder.getByLabel("Номер судебного дела").fill("2-1111/2026");
      await builder.getByLabel("Истец").fill("Истец");
      await builder.getByLabel("Предмет документа").fill("Спор о праве пользования");
    } else {
      await builder.getByLabel("Адресат (орган, должностное лицо)").fill("Департамент городского имущества Москвы");
      if (route.path === "/zhaloba-na-dgi-moskvy") {
        await builder.getByLabel("Место жительства").fill("Москва, адрес места жительства");
        await builder.getByLabel("Контактный телефон").fill("+7 495 000-00-00");
      }
      await builder.getByLabel(route.path === "/zhaloba-na-dgi-moskvy"
        ? "Госуслуга и предмет жалобы" : "Предмет документа").fill("Документы по жилищному вопросу");
    }
    await expect(download).toBeEnabled();
    await builder.getByRole("button", { name: "Показать текст" }).click();
    const preview = builder.getByLabel("Подготовленный текст");
    await expect(preview).toHaveValue(/Иванов Иван/);
    await expect(preview).toHaveValue(/Факты и доказательства, внесённые пользователем\./);
    const [file] = await Promise.all([
      page.waitForEvent("download"),
      download.click(),
    ]);
    expect(file.suggestedFilename()).toMatch(/\.txt$/);
    await expect(builder.getByText(/Правовые основания:/)).toBeVisible();
  });
}

test("a DGI complaint is never offered as a court pretension", async ({ page }) => {
  await page.goto("/zhaloba-na-dgi-moskvy");
  const builder = page.getByRole("region", { name: "Подготовить жалобу на предоставление госуслуги" });
  await expect(builder).toContainText("не судебный документ");
  await expect(builder.locator('a[href="https://minjust.gov.ru/ru/documents/7743/"]')).toHaveCount(1);
});

test("public guidance hides editorial import labels but not legal source links", async ({ page }) => {
  const routes = ["/rukovodstvo-dgi-moskvy", "/rasporyazheniya-prikazy-dgi-moskvy", "/zapis-na-priem-dgi-moskvy"];
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("body")).not.toContainText("СВЕРЕННЫЕ СВЕДЕНИЯ И ВАЖНЫЕ УСЛОВИЯ");
    await expect(page.locator("main .article-topic")).not.toHaveCount(0);
  }
});
