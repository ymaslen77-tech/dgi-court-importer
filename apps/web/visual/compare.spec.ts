import {test,expect} from "@playwright/test";
const routes=["/","/privatizaciya-zhilya","/socialnyj-naem",
  "/renovaciya-pereselenie","/sudebnaya-praktika-dgi",
  "/novosti-zhilishchnogo-prava"];
for(const route of routes){
  test("source vs Next.js: "+route,async ({page},testInfo)=>{
    for(const [name,origin] of [
      ["webflow","https://dgimos.webflow.io"],
      ["next","http://127.0.0.1:3000"],
    ] as const){
      const r=await page.goto(origin+route,{
        waitUntil:"domcontentloaded",timeout:25000});
      expect(r?.status()).toBe(200);
      await page.screenshot({path:testInfo.outputPath(name+".png"),
        animations:"disabled",fullPage:false});
    }
  });
}
