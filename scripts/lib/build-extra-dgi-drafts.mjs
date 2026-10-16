// Deterministic projection of 18 guides, 20 legal references and seven DGI services
// into PRIVATE Payload CMS drafts. This intentionally does not grant legal approval.
import {readFileSync} from "node:fs";
const read=p=>JSON.parse(readFileSync(new URL("../../"+p,import.meta.url),"utf8"));
const para=text=>({kind:"p",text:String(text??"").trim()});
const heading=text=>({kind:"h2",text});
const link=(url,label)=>({kind:"link",text:label,href:url});
const validUrl=url=>typeof url==="string"&&url.startsWith("https://");
export function buildExtraDgiDrafts(){
 const gs=read("apps/web/src/data/housing-guides.json").guides;
 const ls=read("apps/web/src/data/housing-law-catalog.json").laws;
 const ss=read("apps/web/src/data/dgi-service-register.json").services;
 if(gs.length!==18||ls.length!==20||ss.length!==7)throw Error("Unexpected supplemental content inventory");
 const drafts=[
 ...gs.map(g=>({
  kind:"guide",slug:g.slug,title:g.title,description:g.summary,
  seoTitle:g.title+" — правовые основания и документы",
  seoDescription:g.summary,
  sourceUrls:g.sources.filter(s=>validUrl(s.url)).map(s=>({url:s.url})),
  blocks:[para(g.summary),heading("Правовые основания"),para(g.legal),
   heading("Документы"),...g.documents.map(para),heading("Порядок действий"),...g.steps.map(para),
   heading("Порядок обжалования"),para(g.objection),
   heading("Источники"),...g.sources.filter(s=>validUrl(s.url)).map(s=>link(s.url,s.label))].filter(b=>b.text),
 })),
 ...ls.map(l=>({
  kind:"normative",slug:"normativ-"+l.id,title:l.title,
  description:l.subject,seoTitle:l.title+" — нормативное основание",
  seoDescription:l.subject,
  sourceUrls:validUrl(l.sourceUrl)?[{url:l.sourceUrl}]:[],
  blocks:[{kind:"h1",text:l.title},para(l.subject),para("Действующая редакция и приложения пока не прошли полную юридическую приёмку."),
   ...(validUrl(l.sourceUrl)?[link(l.sourceUrl,"Исходный опубликованный или справочный документ")]:[])],
 })),
 ...ss.map(s=>({
  kind:"guide",slug:"gosusluga-dgi-"+s.id,title:s.title,
  description:s.area+" — "+s.law,
  seoTitle:s.title+" — регламент государственной услуги",
  seoDescription:s.area+" — "+s.law,
  sourceUrls:validUrl(s.officialSource)?[{url:s.officialSource}]:[],
  blocks:[{kind:"h1",text:s.title},para("Ведомство: "+s.authority),
   para("Правовое основание: "+s.law),
   para("До обращения необходимо проверить: "+s.remaining),
   ...(validUrl(s.officialSource)?[link(s.officialSource,"Официальный первоисточник")]:[])],
 })),
 ];
 if(drafts.length!==45||new Set(drafts.map(x=>x.slug)).size!==45)throw Error("Duplicate or missing editorial drafts");
 for(const x of drafts){
  if(!/^[a-z0-9-]+$/.test(x.slug)||!x.title||!x.blocks.length||
   x.blocks.some(b=>!b.text||b.text.length>10000||!["h1","h2","h3","h4","p","link"].includes(b.kind)||
     (b.kind==="link"&&!validUrl(b.href))))
   throw Error("Invalid supplemental draft "+x.slug);
 }
 return drafts;
}
