import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Link from "next/link";
import {PageShell} from "@/components/PageShell";
import {courtFullTextReadsEnabled,courtActBasePath,searchPublishedCourtActs} from "@/data/court-fulltext";
import {siteOrigin} from "@/data/pages";

export const dynamic="force-dynamic";
type Props={searchParams:Promise<{q?:string;after?:string}>};
const location=new URL(courtActBasePath,siteOrigin).toString();

export async function generateMetadata({searchParams}:Props):Promise<Metadata>{
 const {q,after}=await searchParams;
 const isSearch=Boolean(q||after);
 return {
  title:{absolute:"Судебные акты по жилищным и имущественным спорам Москвы"},
  description:"Официальные тексты судебных решений и определений: поиск по формулировкам, номеру дела, суду и теме спора.",
  robots:courtFullTextReadsEnabled&&!isSearch?{index:true,follow:true}:{index:false,follow:false},
  alternates:courtFullTextReadsEnabled&&!isSearch?{canonical:location}:undefined,
 };
}
export default async function CourtActsIndex({searchParams}:Props){
 if(!courtFullTextReadsEnabled)notFound();
 const args=await searchParams;
 const q=typeof args.q==="string"?args.q:"";
 const after=typeof args.after==="string"?args.after:null;
 let result;
 try {result=await searchPublishedCourtActs(q,after);}
 catch(e){if(e instanceof RangeError)notFound();throw e;}
 // Never index a thin, empty court-cases directory.
 if(!q&&!after&&!result.items.length)notFound();
 const queryHref=(cursor:string)=>`${courtActBasePath}?${new URLSearchParams({...(q?{q}:{}),after:cursor}).toString()}`;
 return <PageShell variant="thematic">
  <section className="hero hero--thematic"><div className="container">
    <div className="hero-eyebrow">ДГИ · СУДЕБНЫЕ АКТЫ</div>
    <h1>Судебные решения и определения по жилищным и имущественным спорам</h1>
    <p className="hero-lead">На сайте хранятся полные проверенные к публикации тексты официальных судебных актов. Поиск учитывает формулировки решений, номера дел, суды и темы.</p>
  </div></section>
  <section className="article-section"><div className="container">
   <form action={courtActBasePath} method="get" role="search">
    <label htmlFor="court-act-q">Поиск в судебных актах</label>
    <input id="court-act-q" name="q" maxLength={100} defaultValue={q}
       placeholder="Например, отказ в постановке на жилищный учёт"/>
    <button type="submit">Найти</button>
   </form>
   {result.items.length===0?<p>По вашему запросу опубликованных судебных актов не найдено.</p>:
    <ol className="housing-law-list">
     {result.items.map(item=><li key={item.slug} className="housing-law-entry">
      <h2><Link href={`${courtActBasePath}/${item.slug}`}>{item.seo_title}</Link></h2>
      <p>{item.court_name} · Дело № {item.case_number} · {item.decision_date}</p>
      <p>{item.seo_description}</p>
      {q && item.excerpt && <p aria-label="Фрагмент судебного акта по запросу">Фрагмент текста: {item.excerpt}</p>}
     </li>)}
    </ol>}
   {result.nextCursor&&<p><Link href={queryHref(result.nextCursor)}>Следующие судебные акты →</Link></p>}
   <p>Публикуются только документы с проверенным официальным текстом и обезличиванием. Отдельное определение не подтверждает автоматически окончательный исход всего судебного спора.</p>
  </div></section>
 </PageShell>;
}
