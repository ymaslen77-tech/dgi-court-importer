import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {PageShell} from "@/components/PageShell";
import {getPublishedCourtAct,relatedPublishedCourtActs,courtActBasePath} from "@/data/court-fulltext";
import {siteOrigin} from "@/data/pages";

export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
const actName:Record<string,string>={decision:"Решение",ruling:"Определение",judgment:"Приговор",order:"Постановление",other:"Судебный акт"};
function urlFor(slug:string){return new URL(`${courtActBasePath}/${slug}`,siteOrigin).toString();}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {slug}=await params;
 const act=await getPublishedCourtAct(slug);
 if(!act)return {robots:{index:false,follow:false}};
 return {
  title:{absolute:act.seo_title},
  description:act.seo_description,
  alternates:{canonical:urlFor(act.slug)},
  robots:{index:true,follow:true},
  openGraph:{type:"article",title:act.seo_title,description:act.seo_description,
   url:urlFor(act.slug),locale:"ru_RU",publishedTime:act.decision_date},
 };
}
export default async function CourtActPage({params}:Props){
 const {slug}=await params;
 const act=await getPublishedCourtAct(slug);
 if(!act)notFound();
 const related=await relatedPublishedCourtActs(act.case_id,act.slug);
 const title=`${actName[act.act_type]||"Судебный акт"} по делу № ${act.case_number}`;
 const url=urlFor(act.slug);
 // No invented author, winner, legal outcome, reviews or unsupported schema.
 const schema={"@context":"https://schema.org","@graph":[
  {"@type":"WebPage","@id":url,name:act.seo_title,url,inLanguage:"ru",
    description:act.seo_description},
  {"@type":"CreativeWork",name:title,inLanguage:"ru",datePublished:act.decision_date,
    identifier:[act.case_number,...(act.uid?[act.uid]:[])],
    isBasedOn:act.official_url,url},
  {"@type":"BreadcrumbList",itemListElement:[
    {"@type":"ListItem",position:1,name:"Главная",item:siteOrigin},
    {"@type":"ListItem",position:2,name:"Судебные акты",item:new URL(courtActBasePath,siteOrigin).toString()},
    {"@type":"ListItem",position:3,name:title,item:url},
  ]},
 ]};
 const json=JSON.stringify(schema).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
 return <PageShell variant="thematic">
   <script type="application/ld+json" dangerouslySetInnerHTML={{__html:json}}/>
   <section className="hero hero--thematic"><div className="container">
    <div className="hero-eyebrow">СУДЕБНЫЕ АКТЫ · ОФИЦИАЛЬНЫЙ ТЕКСТ</div>
    <h1>{title}</h1>
    <p className="hero-lead">{act.topic}</p>
   </div></section>
   <section className="article-section"><div className="container">
     <nav aria-label="Навигация по судебным актам"><Link href={courtActBasePath}>← Все опубликованные судебные акты</Link></nav>
     <h2 className="article-h2">Реквизиты судебного акта</h2>
     <dl className="legacy-case-detail">
       <div><dt>Суд</dt><dd>{act.court_name}</dd></div>
       <div><dt>Номер дела</dt><dd>{act.case_number}</dd></div>
       {act.uid && <div><dt>УИД</dt><dd>{act.uid}</dd></div>}
       <div><dt>Дата акта</dt><dd><time dateTime={act.decision_date}>{act.decision_date}</time></dd></div>
       <div><dt>Инстанция</dt><dd>{act.instance_type}</dd></div>
       <div><dt>Контрольная сумма текста SHA-256</dt><dd><code>{act.full_text_sha256}</code></dd></div>
     </dl>
     <h2 className="article-h2">О чём дело</h2>
     <p className="article-p">{act.editor_note}</p>
     <h2 className="article-h2">Полный текст судебного акта</h2>
     <p className="article-p">Ниже воспроизведён полный проверенный к размещению текст судебного акта. Редакционный комментарий приведён отдельно выше.</p>
     <div className="court-act-fulltext" aria-label="Полный текст судебного акта">
       {act.full_text.split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=>
         <p key={index} style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{paragraph}</p>)}
     </div>
     {related.length>0 && <section aria-label="Другие опубликованные судебные акты по этому делу">
       <h2 className="article-h2">Другие судебные акты по этому делу</h2>
       <ul>{related.map(item=><li key={item.slug}>
         <Link href={`${courtActBasePath}/${item.slug}`}>{item.seo_title}</Link>
         <span> — {item.court_name}, {item.decision_date}</span>
       </li>)}</ul>
     </section>}
     <h2 className="article-h2">Первоначальный официальный источник</h2>
     <p className="article-p"><a href={act.official_url} target="_blank" rel="noopener noreferrer">Открыть официальный судебный акт ↗</a></p>
     <p className="article-p">Источник: официальный сайт суда. Содержание других инстанций не подразумевается подтверждённым, если их акты не представлены отдельно.</p>
   </div></section>
 </PageShell>;
}
