import {test,expect} from "@playwright/test";

test("private navigator has seven source-neutral groups and stays noindex",async({page})=>{
  const response=await page.goto("/navigator-dgi",{waitUntil:"domcontentloaded"});
  expect(response?.status()).toBe(200);
  await expect(page.locator("main h1")).toHaveText("Навигатор жилищных тем");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content",/noindex/);
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  await expect(page.locator("details.navigator-preview-group")).toHaveCount(7);
  await expect(page.locator("details.navigator-preview-group li a")).toHaveCount(19);
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
    await expect(groups.first().locator("a")).toHaveCount(3);
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
  await expect(page.locator('a[href="/otkaz-v-privatizacii-kvartiry"]')).toHaveCount(2);
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
