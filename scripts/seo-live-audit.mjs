// Real HTTP SEO audit of the canonical production beta. No writes, no crawling
// of third-party services, no index-submission and no impact on publication flags.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const origin = "https://dgi-pravo.ru";
const pages = Array.from({length:6}, (_,i) =>
  JSON.parse(readFileSync(new URL(`../apps/web/src/data/pages-${i}.json`,import.meta.url),"utf8"))).flat();
const paths = [...new Set([...pages.map(x=>x.slug ? "/"+x.slug : "/"),
  "/reestr-gosuslug-dgi", "/spravochnik-zhilishchnogo-zakonodatelstva-moskvy"])];
const pending = [...paths];
const outputs=[];
const strictSocial = process.env.SEO_EXPECT_SOCIAL === "1";

function meta(html, key, attr="name"){
  const tags=html.match(/<meta\b[^>]*>/gi)||[];
  const tag=tags.find(x=>new RegExp('\\b'+attr+'="'+key+'"','i').test(x));
  return (tag?.match(/\bcontent="([^"]*)"/i)||[])[1]||"";
}
function title(html){return (html.match(/<title[^>]*>([^<]*)<\/title>/i)||[])[1]||""}
async function fetchOnce(path){
 const url=origin+path;let last;
 for(let i=0;i<2;i++){
  try{
    const start=Date.now();
    const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:"manual",headers:{"user-agent":"DGI-SEO-Audit/1.0"}});
    const responseMs=Date.now()-start;
    const html=await response.text();
    const issues=[], warnings=[];
    if(response.status!==200) issues.push("http_"+response.status);
    if(!response.headers.get("content-type")?.includes("text/html")) issues.push("not_html");
    const name=title(html);
    const description=meta(html,"description");
    const h1=(html.match(/<h1\b/gi)||[]).length;
    const robots=response.headers.get("x-robots-tag")||"";
    const og=meta(html,"og:title","property");
    if(!name.trim()) issues.push("missing_title");
    if(!description.trim()) issues.push("missing_description");
    if(h1!==1) issues.push("h1_count_"+h1);
    if(!robots.includes("noindex")) issues.push("unreviewed_beta_missing_noindex");
    if(!og) (strictSocial?issues:warnings).push("missing_og_title");
    if(!meta(html,"twitter:card")) (strictSocial?issues:warnings).push("missing_twitter_card");
    if(html.includes('rel="canonical"')&&!robots.includes("noindex")) warnings.push("canonical_check_needed");
    last={path,status:response.status,title:name,descriptionLen:description.length,h1,robots,
      og:Boolean(og),responseMs,issues,warnings};
    if(!issues.length||i===1)break;
  }catch(e){last={path,issues:["request_failed_"+String(e).slice(0,100)],warnings:[]}}
 }
 return last;
}
async function worker(){while(pending.length){const path=pending.shift();if(!path)continue;const r=await fetchOnce(path);outputs.push(r);
 console.log((r.issues.length?"FAIL":"PASS")+" "+path+" "+(r.status||0)+" title="+Boolean(r.title)+" h1="+r.h1+" warnings="+r.warnings.length)}}
await Promise.all(Array.from({length:4},()=>worker()));
outputs.sort((a,b)=>a.path.localeCompare(b.path));
const duplicates=(key)=>Object.entries(Object.groupBy(outputs.filter(x=>x[key]),x=>x[key]))
 .filter(([,v])=>v.length>1).map(([value,rows])=>({value,paths:rows.map(x=>x.path)}));
const problems=[];
if(duplicates("title").length)problems.push("duplicate_page_titles");
for(const path of ["/robots.txt","/sitemap.xml"]){
 const r=await fetch(origin+path,{signal:AbortSignal.timeout(20000)});
 const body=await r.text();
 if(r.status!==200)problems.push(path+"_http_"+r.status);
 if(path.endsWith(".txt")&&!/Disallow:\s*\/\s*(\n|$)/i.test(body))problems.push("robots_staging_gate_unexpected");
 if(path.endsWith(".xml")&&body.includes("<loc>"))problems.push("unapproved_beta_sitemap_leaks_urls");
}
try{
 const r=await fetch("https://www.dgi-pravo.ru/",{redirect:"manual",signal:AbortSignal.timeout(20000)});
 if(![301,308].includes(r.status))problems.push("www_does_not_redirect_permanently");
 const destination=new URL(r.headers.get("location")||"https://www.dgi-pravo.ru/");
 if(destination.hostname!=="dgi-pravo.ru")problems.push("www_redirect_wrong_host");
}catch(e){problems.push("www_redirect_fetch_failed_"+String(e).slice(0,100))}
const result={origin,checkedAt:new Date().toISOString(),pages:outputs.length,passed:outputs.filter(x=>!x.issues.length).length,
 errors:[...outputs.filter(x=>x.issues.length).flatMap(x=>x.issues.map(issue=>({path:x.path,issue}))),...problems.map(issue=>({path:"site",issue}))],
 warnings:outputs.filter(x=>x.warnings.length).flatMap(x=>x.warnings.map(issue=>({path:x.path,issue}))),
 duplicateTitles:duplicates("title"),pagesDetail:outputs,
 note:"No-index is intentional until legal approval; this is HTTP metadata audit, not Google Search Console coverage or field CWV."};
mkdirSync("test-results",{recursive:true});writeFileSync("test-results/seo-live-audit.json",JSON.stringify(result,null,2));
console.log("SEO LIVE AUDIT SUMMARY",JSON.stringify({pages:result.pages,passed:result.passed,errors:result.errors.length,warnings:result.warnings.length}));
if(result.errors.length)process.exitCode=1;
