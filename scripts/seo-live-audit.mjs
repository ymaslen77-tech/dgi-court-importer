#!/usr/bin/env node
// Read-only, production-oriented HTTP SEO audit. No index submissions, flags,
// DNS, CMS, or publication statuses are changed by this script.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";

const origin = "https://dgi-pravo.ru";
const startedAt = new Date().toISOString();
const sourceSha = process.env.SEO_AUDITED_SHA || "not_provided";
const timeoutMs = 16000;
const headers = { "user-agent": "DGI-SEO-Production-Audit/2.0" };
const errors = [], warnings = [], pages = [], checks = [];
const addError = (path, code, detail = "") => errors.push({path,code,detail:String(detail).slice(0,320)});
const addWarning = (path, code, detail = "") => warnings.push({path,code,detail:String(detail).slice(0,320)});
function readJson(path) { return JSON.parse(readFileSync(new URL("../" + path,import.meta.url),"utf8")); }
function attribute(tag, key) {
  const hit = tag.match(new RegExp("\\b" + key + "\\s*=\\s*(['\\\"])(.*?)\\1","i"));
  return hit ? hit[2] : "";
}
function tags(html, name) { return html.match(new RegExp("<" + name + "\\b[^>]*>","gi")) || []; }
function meta(html, name) {
  return tags(html,"meta").filter(tag => attribute(tag,"name").toLowerCase()===name.toLowerCase())
    .map(tag => attribute(tag,"content")).join(",");
}
function canonical(html) {
  const candidates = tags(html,"link").filter(tag =>
    attribute(tag,"rel").toLowerCase().split(/\\s+/).includes("canonical"));
  return candidates.map(tag => attribute(tag,"href"));
}
async function get(path, options={}) {
  const url = new URL(path,origin);
  if (url.origin !== origin) throw new Error("Refusing an external audit target");
  const start=Date.now();
  const response = await fetch(url, {
    redirect: options.redirect || "manual",
    signal: AbortSignal.timeout(timeoutMs),
    headers,
  });
  const body = await response.text();
  return {response,body,ms:Date.now()-start,url:url.toString()};
}
async function safeGet(path, options={}) {
  try {return await get(path,options);} catch(e) {
    addError(path,"request_failed",e instanceof Error?e.message:e);
    return null;
  }
}
function normalized(path) {
  const url=new URL(path,origin);
  if(url.origin!==origin || url.username || url.password || url.hash)
    return null;
  return url.toString();
}
const owner = readJson("apps/web/src/data/owner-released-legacy-pages.json").approved_existing_slugs;
const news = readJson("apps/web/src/data/housing-news.json");
const cases = readJson("apps/web/src/data/verified-court-static.json")
  .filter(row => row.source_checked===true &&
    (row.privacy_checked===true || row.privacy_screen_passed===true) &&
    /^[a-f0-9]{64}$/.test(row.full_text_sha256) && /^[a-f0-9]{64}$/.test(row.pdf_sha256));
const expected = new Set(owner
  .filter(slug => !["novosti-zhilishchnogo-prava","sudebnaya-praktika-dgi"].includes(slug))
  .map(slug => normalized("/"+slug)));
for(const path of ["/o-proekte","/novosti-zhilishchnogo-prava","/sudebnaya-praktika-dgi"])
  expected.add(normalized(path));
for(const item of news)expected.add(normalized("/novosti-zhilishchnogo-prava/"+item.slug));
for(const act of cases)expected.add(normalized("/sudebnaya-praktika-dgi/"+act.slug));

const robots=await safeGet("/robots.txt");
if(robots){
  if(robots.response.status!==200)addError("/robots.txt","http_status",robots.response.status);
  if(/(^|\\n)\\s*Disallow:\\s*\\/\\s*($|\\n)/i.test(robots.body))
    addError("/robots.txt","whole_site_disallow","Public website remains blocked by robots.txt");
  if(!/Sitemap:\\s*https:\/\/dgi-pravo\\.ru\/sitemap\\.xml/i.test(robots.body))
    addError("/robots.txt","missing_sitemap_declaration");
  checks.push({path:"/robots.txt",status:robots.response.status,blocked:/(^|\\n)\\s*Disallow:\\s*\\/\\s*($|\\n)/i.test(robots.body)});
}
let sitemapUrls=[];
const sitemap=await safeGet("/sitemap.xml");
if(sitemap){
  if(sitemap.response.status!==200)addError("/sitemap.xml","http_status",sitemap.response.status);
  const locs=[...sitemap.body.matchAll(/<loc>\\s*([^<]+)\\s*<\\/loc>/gi)]
    .map(match=>match[1].trim().replaceAll("&amp;","&"));
  sitemapUrls=locs.map(normalized);
  if(!locs.length)addError("/sitemap.xml","empty_sitemap");
  if(sitemapUrls.some(x=>x===null))addError("/sitemap.xml","unexpected_external_or_invalid_url");
  const valid=sitemapUrls.filter(Boolean);
  if(valid.length!==new Set(valid).size)addError("/sitemap.xml","duplicate_loc");
  const published = new Set(valid);
  for(const url of expected) {
    if(url&&!published.has(url))addError("/sitemap.xml","published_url_missing",url);
  }
  // CMS entries can legitimately add published URLs; do not auto-index drafts.
  const extra=valid.filter(url=>!expected.has(url));
  for(const url of extra.slice(0,30))addWarning("/sitemap.xml","verify_additional_published_url",url);
  checks.push({path:"/sitemap.xml",status:sitemap.response.status,urls:valid.length,
    expectedFromSource:expected.size,extraPublished:extra.length});
}

const targets=new Set(sitemapUrls.filter(Boolean));
for(const sample of ["/","/o-proekte","/novosti-zhilishchnogo-prava","/sudebnaya-praktika-dgi",
  ...news.slice(0,1).map(row=>"/novosti-zhilishchnogo-prava/"+row.slug),
  ...cases.slice(0,1).map(row=>"/sudebnaya-praktika-dgi/"+row.slug)])targets.add(normalized(sample));
const queue=[...targets].filter(Boolean);
async function worker() {
  while(queue.length){
    const url=queue.shift();if(!url)continue;
    const path=new URL(url).pathname;
    const result=await safeGet(path);
    if(!result)continue;
    const {response,body,ms}=result;
    const failures=[];
    if(response.status!==200)failures.push("http_"+response.status);
    if(!response.headers.get("content-type")?.includes("text/html"))
      failures.push("not_html");
    const title=(body.match(/<title[^>]*>([^<]*)<\\/title>/i)||[])[1]||"";
    const desc=meta(body,"description");
    const h1=(body.match(/<h1\\b/gi)||[]).length;
    const robotRules=(response.headers.get("x-robots-tag")||"")+" "+meta(body,"robots")+
      " "+meta(body,"googlebot")+" "+meta(body,"yandex");
    const canonicals=canonical(body);
    if(/noindex/i.test(robotRules))failures.push("unexpected_noindex");
    if(!title.trim())failures.push("missing_title");
    if(!desc.trim())failures.push("missing_description");
    if(h1!==1)failures.push("h1_count_"+h1);
    if(canonicals.length!==1 || normalized(canonicals[0])!==url)
      failures.push("missing_or_mismatched_canonical");
    if(!/<html\\b[^>]*\\blang=["']ru["']/i.test(body))
      failures.push("missing_ru_html_lang");
    const viewport=meta(body,"viewport");
    if(!viewport)failures.push("missing_viewport");
    if(!meta(body,"og:title"))addWarning(path,"missing_og_title");
    const page={path,status:response.status,ms,title:title.slice(0,180),descriptionLength:desc.length,
      h1,canonicals,robots:robotRules.trim().slice(0,150),failures};
    pages.push(page);
    for(const failure of failures)addError(path,failure);
  }
}
await Promise.all(Array.from({length:5},worker));
pages.sort((a,b)=>a.path.localeCompare(b.path));
const titleMap=new Map();
for(const page of pages){
  if(!page.title)continue;
  if(!titleMap.has(page.title))titleMap.set(page.title,[]);
  titleMap.get(page.title).push(page.path);
}
for(const [title,paths] of titleMap){
  if(paths.length>1)addWarning("site","duplicate_titles",{title,paths});
}

// Validate that site-only drafts remain unavailable and unexpected paths return 404.
for(const path of ["/reestr-gosuslug-dgi","/spravochnik-zhilishchnogo-zakonodatelstva-moskvy",
  "/seo-audit-not-found-2026-11-09"]){
  const result=await safeGet(path);
  if(result && result.response.status!==404)
    addError(path,"preview_or_unknown_route_exposed",result.response.status);
}
const pdfCase=cases[0];
if(pdfCase){
  const pdfPath="/api/courts/verified/"+pdfCase.slug+"/pdf";
  try{
    const response=await fetch(origin+pdfPath,{headers,signal:AbortSignal.timeout(timeoutMs)});
    const contentType=response.headers.get("content-type")||"";
    const xRobots=response.headers.get("x-robots-tag")||"";
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(response.status!==200 || !contentType.includes("application/pdf") ||
      bytes.length<300 || String.fromCharCode(...bytes.slice(0,5))!=="%PDF-")
      addError(pdfPath,"published_pdf_missing_or_invalid",{status:response.status,contentType,size:bytes.length});
    if(!/noindex/i.test(xRobots))addError(pdfPath,"published_pdf_missing_noindex");
    checks.push({path:pdfPath,status:response.status,contentType,xRobots,bytes:bytes.length});
  }catch(e){addError(pdfPath,"pdf_request_failed",e);}
}
try{
  const start=Date.now();
  const response=await fetch("https://www.dgi-pravo.ru/",{redirect:"manual",headers,
    signal:AbortSignal.timeout(timeoutMs)});
  const location=response.headers.get("location")||"";
  if(![301,308].includes(response.status) || normalized(location)!==origin+"/")
    addError("https://www.dgi-pravo.ru/","www_redirect_invalid",{status:response.status,location});
  checks.push({path:"www-redirect",status:response.status,location,ms:Date.now()-start});
}catch(e){addError("https://www.dgi-pravo.ru/","www_request_failed",e);}
const output={
  version:2,checkedAt:startedAt,origin,mode:"published_public_html",
  sourceSha,expectedPublishedFromCheckout:expected.size,
  sitemapUrlCount:sitemapUrls.filter(Boolean).length,auditedHtmlPages:pages.length,
  errors,warnings,checks,pages,
  limitations:[
    "Live HTTP crawlability does not prove inclusion in Google or Yandex indexes.",
    "Source SHA is not verified deployed Coolify SHA; confirm deployment separately.",
    "The audit does not modify website permissions, publication flags, DNS or indexing.",
    "Core Web Vitals and Search Console/Yandex Webmaster require separate data sources.",
  ],
};
mkdirSync("test-results",{recursive:true});
writeFileSync("test-results/seo-live-audit.json",JSON.stringify(output,null,2)+"\\n");
console.log("DGI LIVE SEO",JSON.stringify({mode:output.mode,sourceSha,
  sitemapUrlCount:output.sitemapUrlCount,audited:output.auditedHtmlPages,
  errors:errors.length,warnings:warnings.length}));
for(const entry of errors.slice(0,35))console.error("SEO_ERROR",entry.path,entry.code,entry.detail);
if(errors.length)process.exitCode=1;
