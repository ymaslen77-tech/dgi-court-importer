// Sweep all public static Webflow pages at phone, tablet and desktop widths.
const fs=require('node:fs');const {chromium}=require('playwright');
const site='https://dgimos.webflow.io';
const paths=[
  "/rukovodstvo-dgi-moskvy",
  "/rasporyazheniya-prikazy-dgi-moskvy",
  "/zapis-na-priem-dgi-moskvy",
  "/torgi-dgi-moskvy",
  "/arenda-zemli-dgi-moskvy",
  "/zhaloba-na-dgi-moskvy",
  "/zayavlenie-v-dgi-moskvy",
  "/zashchita-prav-sobstvennika-mkd",
  "/pereplanirovka-kvartiry-moskva",
  "/avariynoe-zhile-moskva",
  "/pereraschet-zhku-moskva",
  "/vymorochnoe-imushchestvo-moskva",
  "/vymorochnoe-imushchestvo-kvartira-moskva",
  "/isk-o-vyselenii-socialnyy-naem",
  "/snyatie-s-zhilishchnogo-ucheta-moskva",
  "/otkaz-v-privatizacii-kvartiry",
  "/novosti-zhilishchnogo-prava",
  "/sudebnaya-praktika-dgi",
  "/dokumenty-na-kvartiru",
  "/zhilishchnaya-ochered",
  "/zhilishchnye-subsidii",
  "/spory-s-dgi",
  "/kontakty-dgi",
  "/kadastrovaya-stoimost",
  "/gosuslugi-dgi",
  "/normativnye-akty",
  "/gorodskoe-imushchestvo-i-zemlya",
  "/renovaciya-pereselenie",
  "/socialnyj-naem",
  "/privatizaciya-zhilya",
  "/zhilishchnyj-uchet",
  "/funkcii-dgi",
  "/"
];
const viewports=[320,390,768,1440];
(async()=>{
 const browser=await chromium.launch({headless:true});
 const results=[];let issues=0;
 for(const width of viewports){
  const context=await browser.newContext({viewport:{width,height:820}});
  for(const path of paths){
   const page=await context.newPage();
   try {
    const response=await page.goto(site+path,{waitUntil:'domcontentloaded',timeout:25000});
    await page.waitForTimeout(200);
    const metrics=await page.evaluate(()=>({
      viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,
      h1:!!document.querySelector('h1'),title:document.title,
      email:!!document.querySelector('a[href^="mailto:admin@dgi-pravo.ru"]'),
      offenders:[...document.querySelectorAll('body *')].map(e=>{const r=e.getBoundingClientRect();
        return {className:String(e.className||'').slice(0,100),right:Math.round(r.right)}})
        .filter(x=>x.right>innerWidth+5).slice(0,5)
    }));
    const errors=[];
    if(!response||response.status()>=400)errors.push('HTTP '+response?.status());
    if(metrics.documentWidth>width+3)errors.push('scrollWidth='+metrics.documentWidth);
    if(!metrics.h1)errors.push('missing h1');
    if(['/','/kontakty-dgi'].includes(path)&&!metrics.email)errors.push('missing editorial mailto');
    results.push({path,width,status:response?.status(),...metrics,errors});
    issues+=errors.length;
    console.log((errors.length?'FAIL':'PASS')+' '+width+'px '+path+' '+errors.join(', '));
   } catch(e){results.push({path,width,errors:[String(e)]});issues++;console.log('FAIL '+width+'px '+path+' '+String(e))}
   finally{await page.close()}
  }await context.close();
 }await browser.close();
 fs.mkdirSync('test-results',{recursive:true});
 fs.writeFileSync('test-results/all-pages-responsive.json',JSON.stringify({site,paths:paths.length,viewports,issues,results},null,2));
 console.log('ALL PAGES SUMMARY '+JSON.stringify({pages:paths.length,checks:results.length,issues}));
 if(issues)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
