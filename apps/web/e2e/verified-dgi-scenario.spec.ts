import { test, expect } from "@playwright/test";

const url="/situatsii/dgi-no-response";

test("the verified DGI scenario is reachable only through its published-data entry",async({page})=>{
  const response=await page.goto(url,{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  await expect(page.locator("main h1")).toHaveText("Ответ на обращение в ДГИ не получен");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator(".verified-scenario-sources a")).toHaveCount(3);
  await expect(page.locator("fieldset.verified-scenario-question")).toHaveCount(2);
  await page.goto("/temy-zhilishchnogo-prava");
  await expect(page.locator('.verified-public-scenarios a[href="'+url+'"]')).toHaveCount(1);
  await expect(page.locator('a[href="/navigator-dgi"]')).toHaveCount(0);
});

test("59-FZ general written appeal yields only approved rule and exact draft clause",async({page})=>{
  await page.goto(url);
  const intake=page.locator(".verified-scenario-intake");
  await expect(intake.getByRole("button",{name:"Сформировать проект запроса"})).toBeDisabled();
  await intake.getByLabel("Обычное письменное обращение").check();
  await intake.getByLabel("Да, дата регистрации известна").check();
  await expect(intake.getByRole("button",{name:"Сформировать проект запроса"})).toBeEnabled();
  await expect(intake.locator(".verified-scenario-rule")).toHaveCount(1);
  await expect(intake.locator(".verified-scenario-rule")).toContainText("30 дней");
  await intake.getByRole("button",{name:"Сформировать проект запроса"}).click();
  const draft=intake.getByRole("textbox",{name:"Текст проекта для редактирования перед отправкой"});
  await expect(draft).toBeVisible();
  await expect(draft).toHaveValue(/Прошу сообщить сведения о ходе рассмотрения/);
  await expect(draft).toHaveValue(/Почтовый адрес для ответа/);
  await expect(draft).not.toHaveValue(/заявление в суд|исковое заявление/i);
});

test("special public-service application never inherits general 59-FZ deadline or draft",async({page})=>{
  await page.goto(url);
  const intake=page.locator(".verified-scenario-intake");
  await intake.getByLabel("Заявление на государственную услугу").check();
  await intake.getByLabel("Да, дата регистрации известна").check();
  await expect(intake.getByRole("button",{name:"Сформировать проект запроса"})).toBeDisabled();
  await expect(intake.locator(".verified-scenario-rule")).toHaveCount(0);
  await expect(intake.getByText("Для выбранного сочетания ответов")).toBeVisible();
  await expect(intake.locator("textarea")).toHaveCount(0);
});

test("changing the selected procedure removes an already-created document",async({page})=>{
  await page.goto(url);
  const intake=page.locator(".verified-scenario-intake");
  await intake.getByLabel("Обычное письменное обращение").check();
  await intake.getByLabel("Да, дата регистрации известна").check();
  await intake.getByRole("button",{name:"Сформировать проект запроса"}).click();
  await expect(intake.locator("textarea")).toBeVisible();
  await intake.getByLabel("Заявление на государственную услугу").check();
  await expect(intake.locator("textarea")).toHaveCount(0);
});

test("verified scenario accessible and no horizontal scroll from 320 to 1920px",async({page})=>{
  for(const width of [320,390,768,1280,1920]){
    await page.setViewportSize({width,height:900});
    await page.goto(url,{waitUntil:"domcontentloaded"});
    const first=page.locator(".verified-scenario-option input").first();
    await first.focus();
    await page.keyboard.press("Space");
    await expect(first).toBeChecked();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,"Verified scenario overflow at "+width).toBeLessThanOrEqual(2);
  }
});

test("nonverified route IDs are a strict 404 without indexed SEO",async({page})=>{
  const response=await page.goto("/situatsii/unknown-privatization-claim",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});
