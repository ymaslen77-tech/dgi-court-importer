// Public Vercel production smoke test. Read-only, no credentials or CMS writes.
import { writeFileSync, mkdirSync } from "node:fs";
const base = "https://dgi-housing-preview.vercel.app";
const routes = ["/","/kontakty-dgi","/gosuslugi-dgi","/normativnye-akty","/sudebnaya-praktika-dgi","/robots.txt","/sitemap.xml"];
const results = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
for(const path of routes){
 let last;
 for(let attempt=1;attempt<=3;attempt++){
  try{
   const started=Date.now();
   const response=await fetch(base+path,{signal:AbortSignal.timeout(20000),redirect:"follow",headers:{"user-agent":"DGI-Production-Health/1.0"}});
   const html=await response.text();
   const contentType=response.headers.get("content-type")||"";
   const robots=response.headers.get("x-robots-tag")||"";
   const issues=[];
   if(response.status!==200) issues.push("HTTP "+response.status);
   if(path.endsWith(".txt")){
     if(!html.toLowerCase().includes("disallow: /"))issues.push("robots must block indexing in unapproved release");
   }else if(path.endsWith(".xml")){
     if(html.includes("<loc>"))issues.push("unreviewed release must have empty sitemap");
   }else{
     if(!/text\/html/.test(contentType))issues.push("not HTML");
     if(!html.includes("<h1"))issues.push("missing h1");
     if(!html.includes("mailto:admin@dgi-pravo.ru"))issues.push("editorial email missing");
     if(!robots.toLowerCase().includes("noindex"))issues.push("missing X-Robots-Tag noindex");
     if(html.includes("This Deployment has been protected"))issues.push("production blocked by deployment auth");
   }
   last={path,url:response.url,status:response.status,ms:Date.now()-started,contentType,robots,issues};
   if(!issues.length)break;
  }catch(err){last={path,issues:[String(err).slice(0,200)]};}
  if(attempt<3)await sleep(2500);
 }
 results.push(last);
 console.log((last.issues.length?"FAIL":"PASS")+" "+last.path+" "+(last.status||"ERR")+" "+(last.ms||0)+"ms "+last.issues.join("; "));
}
mkdirSync("test-results",{recursive:true});
writeFileSync("test-results/production-http-smoke.json",JSON.stringify({base,at:new Date().toISOString(),results},null,2));
console.log("HTTP SMOKE SUMMARY",JSON.stringify({total:results.length,passed:results.filter(x=>!x.issues.length).length,failed:results.filter(x=>x.issues.length).length}));
if(results.some(x=>x.issues.length))process.exitCode=1;
