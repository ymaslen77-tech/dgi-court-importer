#!/usr/bin/env node
// Read-only HTTP verification AFTER owner releases production from Coolify.
import { mkdirSync, writeFileSync } from "node:fs";
const origin="https://dgi-pravo.ru";
const required=["/","/o-proekte","/novosti-zhilishchnogo-prava","/sudebnaya-praktika-dgi"];
const checks=[];
function record(path,ok,detail){checks.push({path,ok,detail});}
async function get(path){
  const res=await fetch(origin+path,{redirect:"follow",signal:AbortSignal.timeout(20000),
    headers:{"user-agent":"DGI-Postdeploy-SEO-Audit/1.0"}});
  return {res,body:await res.text()};
}
function robotsBlocked(html,headers){
  const metas=html.match(/<meta\b[^>]*>/gi)||[];
  const tag=metas.find(x=>/\bname=["']robots["']/i.test(x))||"";
  return /noindex/i.test(tag+" "+(headers.get("x-robots-tag")||""));
}
function canonicalTag(html){
  const tags=html.match(/<link\b[^>]*>/gi)||[];
  return tags.find(t=>/\brel=["']canonical["']/i.test(t))||"";
}
const urls=[];
try {
  const {res,body}=await get("/robots.txt");
  const isClosed=/(?:^|\n)\s*Disallow:\s*\/\s*(?:\n|$)/i.test(body);
  const hasSitemap=/Sitemap:\s*https:\/\/dgi-pravo\.ru\/sitemap\.xml/i.test(body);
  record("/robots.txt",res.status===200&&!isClosed&&hasSitemap,
    {status:res.status,excerpt:body.slice(0,350)});
} catch(e){record("/robots.txt",false,{error:String(e)})}
try {
  const {res,body}=await get("/sitemap.xml");
  for(const m of body.matchAll(/<loc>(https:\/\/dgi-pravo\.ru\/[^<]*)<\/loc>/g))
    urls.push(m[1].replace(/&amp;/g,"&"));
  const has=part=>urls.some(u=>u.includes(part));
  record("/sitemap.xml",res.status===200&&has("/novosti-zhilishchnogo-prava/")&&
    has("/sudebnaya-praktika-dgi/")&&urls.length===new Set(urls).size,
    {status:res.status,count:urls.length,news:has("/novosti-zhilishchnogo-prava/"),
      court:has("/sudebnaya-praktika-dgi/")});
} catch(e){record("/sitemap.xml",false,{error:String(e)})}
for(const path of [...new Set([...required,...urls.slice(0,60).map(u=>new URL(u).pathname)])]){
  try{
    const {res,body}=await get(path);
    const canonical=canonicalTag(body);
    const title=/<title[^>]*>[^<]+<\/title>/i.test(body);
    const h1=(body.match(/<h1\b/gi)||[]).length;
    record(path,res.status===200&&!robotsBlocked(body,res.headers)&&
      canonical.includes(origin+path)&&title&&h1===1,
      {status:res.status,robots:res.headers.get("x-robots-tag"),hasCanonical:!!canonical,title,h1});
  }catch(e){record(path,false,{error:String(e)})}
}
mkdirSync("test-results",{recursive:true});
const result={origin,checkedAt:new Date().toISOString(),audited:checks.length,
  failures:checks.filter(x=>!x.ok),checks,notes:[
    "Checks HTTP crawlability, not inclusion in Google/Yandex search index.",
    "Confirm exact Coolify release SHA separately.",
  ]};
writeFileSync("test-results/seo-postdeploy-indexability.json",JSON.stringify(result,null,2));
console.log("DGI POSTDEPLOY INDEXABILITY",
  JSON.stringify({audited:checks.length,failures:result.failures.length,urlsInSitemap:urls.length}));
if(result.failures.length){
  console.log("FAILURES",JSON.stringify(result.failures.slice(0,30)));
  process.exitCode=1;
}
