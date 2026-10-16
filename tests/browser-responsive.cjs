// Browser smoke test for the published Webflow site. No CMS writes.
const { chromium, firefox, webkit } = require('playwright');
const fs = require('node:fs');
const SITE = (process.env.DGI_SITE_URL || 'https://dgimos.webflow.io').replace(/\/$/, '');
const paths = ['/', '/sudebnaya-praktika-dgi', '/gosuslugi-dgi', '/zhaloba-na-dgi-moskvy', '/kontakty-dgi'];
const sizes = [
  { name: 'small-mobile', width: 320, height: 740 },
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
];
const result = [];
let issues = 0;
(async () => {
 for (const [browserName, launcher] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await launcher.launch({ headless: true });
  for (const size of sizes) {
   const context = await browser.newContext({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
   for (const path of paths) {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', err => errors.push(String(err).slice(0, 200)));
    let response, elapsed;
    try {
     const started = Date.now();
     response = await page.goto(SITE + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
     await page.waitForTimeout(600);
     elapsed = Date.now() - started;
     const info = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
      title: document.title,
      h1: !!document.querySelector('h1'),
      email: !!document.querySelector('a[href^="mailto:admin@dgi-pravo.ru"]'),
      images: [...document.images].filter(i => i.complete && !i.naturalWidth).length,
      visibleNavigation: [...document.querySelectorAll('nav a,header a')].filter(a => {
       const r = a.getBoundingClientRect(), s = getComputedStyle(a);
       return r.width > 0 && r.height > 0 && s.visibility !== 'hidden';
      }).length,
     }));
     const problems = [];
     if (!response || response.status() >= 400) problems.push('HTTP '+(response?.status() || 'missing'));
     if (info.documentWidth > info.viewport + 3) {
       problems.push('horizontal document overflow: '+info.documentWidth+'px');
       if (browserName === 'chromium' && size.width === 320) {
        const offenders = await page.evaluate(() => [...document.querySelectorAll('body *')].map(e => {
         const r=e.getBoundingClientRect(),c=getComputedStyle(e);
         return {cls:String(e.className||'').slice(0,85),tag:e.tagName,
          rect:[Math.round(r.left),Math.round(r.right),Math.round(r.width)],
          scroll:e.scrollWidth,client:e.clientWidth,
          overflow:c.overflowX,grid:c.gridTemplateColumns,
          flex:c.flexDirection,wrap:c.flexWrap,
          parent:String(e.parentElement?.className||'').slice(0,75)};
        }).filter(a=>(a.rect[1]>innerWidth+3 && a.rect[0]<innerWidth+100)
           ||(a.scroll>a.client+10 && a.client>0 && a.rect[0]<innerWidth))
          .sort((a,b)=>b.rect[1]-a.rect[1]).slice(0,30));
        console.log('OVERFLOW TRACE '+path+' '+JSON.stringify(offenders));
       }
     }
     if (!info.h1) problems.push('no h1');
     if ((path === '/' || path === '/kontakty-dgi') && !info.email) problems.push('editorial email link missing');
     if (info.images) problems.push(info.images+' failed images');
     if (errors.length) problems.push('uncaught JS: '+errors.join(' / '));
     issues += problems.length;
     result.push({ browserName, ...size, path, status:response?.status(), domContentLoadedMs:elapsed, ...info, problems });
     console.log((problems.length ? 'FAIL' : 'PASS')+' '+browserName+' '+size.name+' '+path+' '+elapsed+'ms '+problems.join('; '));
    } catch (e) {
     issues++;
     result.push({browserName,...size,path,problems:[String(e)]});
     console.log('FAIL '+browserName+' '+size.name+' '+path+' '+String(e));
    } finally { await page.close(); }
   }
   await context.close();
  }
  await browser.close();
 }
 fs.mkdirSync('test-results', {recursive:true});
 fs.writeFileSync('test-results/responsive-audit.json', JSON.stringify({site:SITE,createdAt:new Date().toISOString(),issues,results:result},null,2));
 console.log('Browser checks:',result.length,'issues:',issues);
 if(issues) process.exitCode = 1;
})().catch(error=>{ console.error(error);process.exitCode=1; });
