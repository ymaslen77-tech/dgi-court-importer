import { setTimeout } from 'node:timers/promises';
const endpoints=['https://dgi-pravo.ru/','https://www.dgi-pravo.ru/','https://dgi-pravo.ru/robots.txt'];
let failed=0;
for(const url of endpoints){
 let error=null;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const started=Date.now();
   const r=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(18000),headers:{'user-agent':'DGI-domain-health-check/1.0'}});
   const html=await r.text();
   const invalid=r.status!==200 || !r.url.startsWith('https://') || (url.endsWith('/')&&!html.includes('mailto:admin@dgi-pravo.ru')) || (url.endsWith('robots.txt')&&!html.toLowerCase().includes('disallow'));
   console.log(JSON.stringify({url,status:r.status,finalUrl:r.url,ms:Date.now()-started,ok:!invalid,server:r.headers.get('server'),xVercelId:!!r.headers.get('x-vercel-id')}));
   if(!invalid){error=null;break}error='Unexpected response or site content';
  }catch(e){error=String(e);console.log('Attempt '+attempt+' '+url+' '+error.slice(0,180));}
  if(attempt<3)await setTimeout(4000);
 }
 if(error){failed++;console.log('FAIL '+url+' '+error)}
}
if(failed)process.exitCode=1;
