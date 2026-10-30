import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { siteIsLive, siteOrigin } from "@/data/pages";
import { getPublicCourtCase, listPublicCourtCaseSlugs } from "@/data/verified-courts";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
const base = "/sudebnaya-praktika-dgi";
const actTypes: Record<string,string> = {
  decision: "Решение", ruling: "Определение", judgment: "Приговор",
  order: "Постановление", other: "Судебный акт",
};
const outcomes: Record<string,string> = {
  applicant_granted: "Требования гражданина удовлетворены",
  applicant_partially_granted: "Требования удовлетворены частично",
  claim_granted: "Иск удовлетворён",
  claim_denied: "В удовлетворении иска отказано",
  mixed: "Смешанный результат", remanded: "Дело направлено на новое рассмотрение",
  not_classified: "Исход указан в полном тексте судебного акта",
};
const canonical = (slug: string) => new URL(base + "/" + slug, siteOrigin).toString();

export function generateStaticParams() {
  return listPublicCourtCaseSlugs().map(({slug}) => ({slug}));
}
export async function generateMetadata({params}: Props): Promise<Metadata> {
  const {slug} = await params;
  const act = siteIsLive ? getPublicCourtCase(slug) : undefined;
  if (!act) return {robots: {index:false,follow:false}};
  const label=actTypes[act.act_type] || "Судебный акт";
  const title=`${label} по делу № ${act.case_number} — ${act.court_name}`;
  const description=`${act.court_name}, ${act.decision_date}. ${outcomes[act.outcome_verified] || outcomes.not_classified}. Полный текст судебного акта, PDF-копия и официальный источник.`;
  return {
    title: {absolute:title}, description,
    alternates: {canonical:canonical(act.slug)},
    robots: {index:true,follow:true},
    openGraph: {type:"article",locale:"ru_RU",title,description,
      url:canonical(act.slug),publishedTime:act.decision_date},
  };
}
export default async function OfficialCourtCasePage({params}: Props) {
  const {slug} = await params;
  if (!siteIsLive) notFound();
  const act=getPublicCourtCase(slug);
  if (!act) notFound();
  const label=actTypes[act.act_type] || "Судебный акт";
  const title=`${label} по делу № ${act.case_number}`;
  const url=canonical(act.slug);
  const schema={
    "@context":"https://schema.org",
    "@graph":[
      {"@type":"WebPage","@id":url,url,name:title,inLanguage:"ru"},
      {"@type":"CreativeWork",name:title,inLanguage:"ru",
        identifier:act.case_number,datePublished:act.decision_date,
        isBasedOn:act.official_url,url},
      {"@type":"BreadcrumbList",itemListElement:[
        {"@type":"ListItem",position:1,name:"Главная",item:siteOrigin},
        {"@type":"ListItem",position:2,name:"Судебная практика",item:new URL(base,siteOrigin).toString()},
        {"@type":"ListItem",position:3,name:title,item:url},
      ]},
    ],
  };
  const json=JSON.stringify(schema).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
  return <PageShell variant="thematic">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:json}}/>
    <section className="hero hero--thematic"><div className="container">
      <nav className="breadcrumb" aria-label="Навигация">
        <Link href="/">Главная</Link><span aria-hidden="true">/</span>
        <Link href={base}>Судебная практика</Link>
      </nav>
      <h1>{title}</h1>
      <p className="hero-lead">{act.court_name} · {act.decision_date}</p>
    </div></section>
    <article className="container housing-news-article">
      <h2>Реквизиты и результат</h2>
      <p><strong>Суд:</strong> {act.court_name}</p>
      <p><strong>Номер дела:</strong> {act.case_number}</p>
      <p><strong>Дата акта:</strong> <time dateTime={act.decision_date}>{act.decision_date}</time></p>
      <p><strong>Тема:</strong> {act.topic}</p>
      <p><strong>Исход:</strong> {outcomes[act.outcome_verified] || outcomes.not_classified}.</p>
      <p>{act.outcome_evidence}</p>
      <p>Этот судебный акт сам по себе не подтверждает окончательный результат всех стадий судебного спора.</p>
      <h2>Полный текст судебного акта</h2>
      <div className="court-act-fulltext" aria-label="Полный текст судебного акта">
        {act.full_text.split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=>
          <p key={index} style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{paragraph}</p>)}
      </div>
      <h2>PDF и официальный источник</h2>
      <p><a href={`/api/courts/verified/${act.slug}/pdf`} target="_blank" rel="noopener noreferrer">
        Открыть PDF-копию для чтения ↗</a>. Копия не является заверенным судом оригиналом.</p>
      <p><a href={act.official_url} target="_blank" rel="noopener noreferrer">Открыть официальный текст на сайте суда ↗</a></p>
      <p><Link href={base}>← Все судебные акты ДГИ</Link></p>
    </article>
  </PageShell>;
}
