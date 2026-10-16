const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const width of [320,390,768]){
   for(const path of ['/','/gosuslugi-dgi']){
     const page=await browser.newPage({viewport:{width,height:850}});
     await page.goto('https://dgimos.webflow.io'+path,{waitUntil:'networkidle',timeout:45000});
     const result=await page.evaluate(()=>{
       const viewport=window.innerWidth;
       const out=[...document.querySelectorAll('body *')].map(e=>{
         const r=e.getBoundingClientRect(),s=getComputedStyle(e);
         return {tag:e.tagName,classes:String(e.className||'').slice(0,150),
           width:Math.round(r.width),left:Math.round(r.left),right:Math.round(r.right),
           scrollWidth:e.scrollWidth,grid:s.gridTemplateColumns,
           overflowX:s.overflowX,position:s.position,text:e.textContent?.trim().slice(0,50)};
       }).filter(o=>o.width>0&&(o.right>viewport+3||o.left< -3))
         .sort((a,b)=>b.right-a.right).slice(0,15);
       return {viewport,documentWidth:document.documentElement.scrollWidth,
         meta:document.querySelector('meta[name="viewport"]')?.content, offenders:out};
     });
     console.log('LAYOUT '+path+' '+width+'px '+JSON.stringify(result));
     await page.close();
   }
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1});
