import {test,expect} from "@playwright/test";

test("private navigator has seven source-neutral groups and stays noindex",async({page})=>{
  const response=await page.goto("/navigator-dgi",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  await expect(page.locator("main h1")).toHaveText("Навигатор жилищных тем");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator("details.navigator-preview-group")).toHaveCount(7);
  await expect(page.locator("details.navigator-preview-group li a")).toHaveCount(23);
  await expect(page.getByText("Это закрытый прототип навигации")).toBeVisible();
});

test("navigator is keyboard-operable across 320–1920px and browser engines",async({page})=>{
  for(const width of [320,360,390,768,1024,1280,1920]){
    await page.setViewportSize({width,height:900});
    await page.goto("/navigator-dgi",{waitUntil:"domcontentloaded"});
    const groups=page.locator("details.navigator-preview-group");
    await groups.first().locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(groups.first()).toHaveAttribute("open","");
    await expect(groups.first().locator("a")).toHaveCount(4);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,"Overflow at "+width).toBeLessThanOrEqual(2);
  }
});

test("preview links point to an existing separately published page",async({page})=>{
  await page.goto("/navigator-dgi");
  const group=page.locator("details.navigator-preview-group").filter({hasText:"Приватизация"}).first();
  await group.locator("summary").click();
  const link=group.locator('a[href="/otkaz-v-privatizacii-kvartiry"]');
  await expect(link).toHaveCount(1);
  await link.click();
  await expect(page).toHaveURL(/\/otkaz-v-privatizacii-kvartiry$/);
  await expect(page.locator("main h1")).toHaveCount(1);
});


test("research-only scenarios expose neutral existing links, not a legal decision",async({page})=>{
  const response=await page.goto("/navigator-dgi");
  expect(response?.status()).toBe(200);
  const scenarios=page.locator("details.navigator-preview-scenario");
  await expect(scenarios).toHaveCount(3);
  await expect(page.getByRole("heading",{name:"Исследуемые ситуации"})).toBeVisible();
  for(let i=0;i<3;i++){
    const item=scenarios.nth(i);
    await expect(item).toHaveAttribute("data-research-status","research_only");
    await item.locator("summary").click();
    await expect(item).toHaveAttribute("open","");
    await expect(item.getByText("Проверка источников не завершена")).toBeVisible();
    await expect(item.locator("li a")).toHaveCount(3);
  }
  await expect(page.locator('details.navigator-preview-group a[href="/otkaz-v-privatizacii-kvartiry"]')).toHaveCount(1);
  await expect(page.locator('details.navigator-preview-scenario a[href="/otkaz-v-privatizacii-kvartiry"]')).toHaveCount(1);
  await expect(page.locator('.navigator-preview-directory a[href="/otkaz-v-privatizacii-kvartiry"]')).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
});

test("scenario keyboard and mobile layout do not introduce overflow",async({page})=>{
  for(const width of [320,390,768,1280,1920]){
    await page.setViewportSize({width,height:900});
    await page.goto("/navigator-dgi");
    const scenario=page.locator("details.navigator-preview-scenario").first();
    await scenario.locator("summary").focus();
    await page.keyboard.press("Enter");
    await expect(scenario).toHaveAttribute("open","");
    const scroll=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(scroll,"Scenario overflow at "+width+"px").toBeLessThanOrEqual(2);
  }
});

test("complete legacy directory and ten existing form destinations stay in private preview",async({page})=>{
  await page.goto("/navigator-dgi",{waitUntil:"domcontentloaded"});
  const directory=page.locator(".navigator-preview-directory").first();
  const forms=page.locator(".navigator-preview-directory").nth(1);
  await expect(directory.locator("a")).toHaveCount(9);
  await expect(forms.locator("a")).toHaveCount(10);
  await expect(directory.locator('a[href="/sudebnaya-praktika-dgi"]')).toHaveCount(1);
  await expect(forms.locator('a[href="/otkaz-v-privatizacii-kvartiry"]')).toHaveCount(1);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("complete directory remains keyboard navigable without horizontal overflow",async({page})=>{
  for(const width of [320,390,768,1280,1920]){
    await page.setViewportSize({width,height:900});
    await page.goto("/navigator-dgi",{waitUntil:"domcontentloaded"});
    const link=page.locator(".navigator-preview-directory a").first();
    await link.focus();
    await expect(link).toBeFocused();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,"Directory overflow at "+width+"px").toBeLessThanOrEqual(2);
  }
});


test("five native fact-only questionnaires stay private and keyboard accessible",async({page})=>{
  const response=await page.goto("/navigator-dgi",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  const questionnaires=page.locator("details.navigator-preview-fact");
  await expect(questionnaires).toHaveCount(5);
  await expect(questionnaires.locator("fieldset")).toHaveCount(21);
  await expect(questionnaires).toHaveAttribute("data-research-status","research_only");
  const first=questionnaires.first();
  await first.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(first).toHaveAttribute("open","");
  const selected=first.locator('input[type="radio"]').first();
  await selected.focus();
  await page.keyboard.press("Space");
  await expect(selected).toBeChecked();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
});

test("private fact questions are responsive on narrow-to-wide viewports",async({page})=>{
  for(const width of [320,390,768,1280,1920]){
    await page.setViewportSize({width,height:900});
    await page.goto("/navigator-dgi",{waitUntil:"domcontentloaded"});
    const questionnaire=page.locator("details.navigator-preview-fact").nth(4);
    await questionnaire.locator("summary").click();
    await expect(questionnaire).toHaveAttribute("open","");
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    expect(overflow,"Questionnaire overflow at "+width).toBeLessThanOrEqual(2);
  }
});
