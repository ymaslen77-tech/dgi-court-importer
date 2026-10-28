#!/usr/bin/env node
// Read-only post-deploy indexability audit. Run AFTER the owner deploys Coolify.
// This script does not submit URLs or change published content.
import {mkdirSync, writeFileSync} from "node:fs";

const origin="https://dgi-pravo.ru";
const required=[
 "/", "/o-proekte", "/novosti-zhilishchnogo-prava",
 "/sudebnaya-praktika-dgi",
];
const checks=[];
function record(path,ok,detail) { checks.push({path,ok,detail}); }
const get=async(path)=>{
  const controller=AbortSignal.timeout(20000);
  const res=await fetch(origin+path,{redirect:"follow",signal:controller,headers:{"user-agent":"DGI-Postdeploy-SEO-Audit/1.0"}});
  return {res,body:await res.text()};
};
function attr(html,tag,field,match){
  return (html.match(new RegExp("<"+tag+"\\b[^>]*"+field+"=[\\\"']"+match+"[\\\"'][^>]*>","i"))||[])[0]||"";
}
function hasNoindex(html,headers){
  const tag=(html.match(/<meta\\b[^>]*name=["']robots["'][^>]*>/i)||[])[0]||"";
  return /noindex/i.test(tag+" "+(headers.get("x-robots-tag")||""));
}
const urls=[];
try {
  const {res,body}=await get("/robots.txt");
  record("/robots.txt",res.status===200&&!/(?:^|\n)\\s*Disallow:\\s*\\/\\s*(?:\n|$)/i.test(body)&&
      /Sitemap:\s*https:\/\/dgi-pravo\.ru\/sitemap\.xml/i.test(body),
    {status:res.status,excerpt:body.slice(0,350)});
} catch(e){record("/robots.txt",false,{error:String(e)})}
try {
  const {res,body}=await get("/sitemap.xml");
  for(const m of body.matchAll(/<loc>(https:\/\/dgi-pravo\.ru\/[^<]*)<\/loc>/g))
    urls.push(m[1].replace(/&amp;/g,"&"));
  const has=(part)=>urls.some(u=>u.includes(part));
  record("/sitemap.xml",res.status===200&&has("/novosti-zhilishchnogo-prava/")&&
    has("/sudebnaya-praktika-dgi/")&&
    urls.length===new Set(urls).size,
    {status:res.status,count:urls.length,news:has("/novosti-zhilishchnogo-prava/"),
      court:has("/sudebnaya-praktika-dgi/")});
} catch(e){record("/sitemap.xml",false,{error:String(e)})}
const htmlRoutes=[...new Set([...required,...urls.slice(0,60).map(u=>new URL(u).pathname)])];
for(const path of htmlRoutes){
  try{
    const {res,body}=await get(path);
    const canonical=(body.match(/<link\\b[^>]*rel=["']canonical["'][^>]*>/i)||[])[0]||"";
    const title=/<title[^>]*>[^<]+<\/title>/i.test(body);
    const h1=(body.match(/<h1\\b/gi)||[]).length;
    record(path,res.status===200&&!hasNoindex(body,res.headers)&&
      canonical.includes(origin+path)&&title&&h1===1,
      {status:res.status,robots:res.headers.get("x-robots-tag"),hasCanonical:!!canonical,title,h1});
  }catch(e){record(path,false,{error:String(e)})}
}
mkdirSync("test-results",{recursive:true});
const result={origin,checkedAt:new Date().toISOString(),audited:checks.length,
  failures:checks.filter(x=>!x.ok),checks,notes:[
    "Only HTTP indexability is checked; Google/Yandex inclusion requires their webmaster consoles.",
    "Verify Coolify commit SHA separately; this audit makes no release claims.",
  ]};
writeFileSync("test-results/seo-postdeploy-indexability.json",JSON.stringify(result,null,2));
console.log("DGI POSTDEPLOY INDEXABILITY",JSON.stringify({audited:checks.length,failures:result.failures.length,urlsInSitemap:urls.length}));
if(result.failures.length){console.log("FAILURES",JSON.stringify(result.failures.slice(0,30)));process.exitCode=1;}
