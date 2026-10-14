// Evidence capture for all 33 Webflow static URLs on desktop and mobile.
// Green screenshots are NOT a pixel-perfect parity or media-rights approval.
import {test,expect} from "@playwright/test";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
const manifest=JSON.parse(readFileSync(
  resolve(process.cwd(),"../../migration/webflow-seo-manifest.json"),"utf8"
)) as {pages:Array<{path:string}>};
if(manifest.pages.length!==33) throw Error("Expected exactly 33 source pages");
const seen=new Set<string>();
for(const {path} of manifest.pages){
  if(seen.has(path)||!/^\/(?:[a-z0-9-]+)?$/.test(path))
    throw Error("Invalid or duplicated source route: "+path);
  seen.add(path);
  test("Source/Next screenshot pair: "+path,async ({page},testInfo)=>{
    for(const [name,origin] of [
      ["webflow","https://dgimos.webflow.io"],
      ["next","http://127.0.0.1:3000"],
    ] as const){
      const response=await page.goto(origin+path,{
        waitUntil:"domcontentloaded",timeout:35000
      });
      expect(response?.status(),name+" "+path).toBe(200);
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({
        path:testInfo.outputPath(name+".png"),
        animations:"disabled",fullPage:false,
      });
    }
  });
}
