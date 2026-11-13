import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { VerifiedScenarioIntake, type VerifiedScenario } from "@/components/VerifiedScenarioIntake";
import { siteIsLive, siteOrigin } from "@/data/pages";
import verified from "@/data/dgi-verified-scenarios.json";

type Props = { params: Promise<{ scenarioId: string }> };
export const dynamic = "force-dynamic";

const base = "/situatsii";
const scenarios = verified.scenarios as VerifiedScenario[];
const sourcesByProcedure: Record<string, Array<{name:string;href:string}>> = {
  "59-fz-general-correspondence": [
    { name:"Минтруд России — Федеральный закон № 59-ФЗ",
      href:"https://mintrud.gov.ru/docs/laws/108" },
    { name:"ФНС России — порядок рассмотрения обращений",
      href:"https://www.nalog.gov.ru/rn77/apply_fts/obr/" },
    { name:"Генеральная прокуратура — разъяснение о сроках",
      href:"https://epp.genproc.gov.ru/ru/dvtp/activity/legal-education/explain/e75300/" },
  ],
  "housing-registration": [
    { name:"Верховный суд РФ — обзор практики по снятию с учёта (2015)",
      href:"https://www.vsrf.ru/documents/all/15162" },
    { name:"Прокуратура Московской области — разъяснение статьи 56 ЖК РФ",
      href:"https://epp.genproc.gov.ru/ru/proc_50/activity/legal-education/explain/e5641068/" },
    { name:"ДГИ Москвы — приказ № 286 о перерегистрации (PDF)",
      href:"https://www.mos.ru/upload/content/files/2c7e35924e244c59dfe270088f191922/PRIKAH286ot21082024.pdf" },
  ],
  "social-tenancy": [
    { name:"Верховный суд РФ — постановление Пленума от 02.07.2009 № 14",
      href:"https://www.vsrf.ru/documents/all/8112" },
    { name:"Прокуратура Республики Марий Эл — разъяснение статьи 69 ЖК РФ",
      href:"https://epp.genproc.gov.ru/ru/proc_12/activity/legal-education/explain/e151947/" },
    { name:"Правительство Москвы — ЖК РФ, редакция от 02.05.2026 (PDF)",
      href:"https://www.mos.ru/upload/documents/files/6377/Kodeksot29_12_2004N188-FZJilishniikodeksRossiiskoiFederacii%28sizmeneniyamina2maya2026_Tekst.pdf" },
  ],
};

function getScenario(id:string) {
  return scenarios.find(entry=>entry.id===id);
}

export function generateStaticParams() {
  return scenarios.map(({id})=>({scenarioId:id}));
}

export async function generateMetadata({params}:Props):Promise<Metadata> {
  const {scenarioId} = await params;
  const scenario=getScenario(scenarioId);
  if (!scenario) return {robots:{index:false,follow:false}};
  return {
    title:{absolute:scenario.seoTitle},
    description:scenario.seoDescription,
    alternates:siteIsLive?{
      canonical:new URL(base+"/"+scenario.id,siteOrigin).toString()
    }:undefined,
    robots:{index:siteIsLive,follow:siteIsLive},
    openGraph:siteIsLive?{
      type:"article", locale:"ru_RU",
      url:new URL(base+"/"+scenario.id,siteOrigin).toString(),
      title:scenario.seoTitle,description:scenario.seoDescription
    }:undefined,
  };
}

export default async function DgiVerifiedScenarioPage({params}:Props) {
  const {scenarioId}=await params;
  const scenario=getScenario(scenarioId);
  if(!scenario) notFound();
  const sources=sourcesByProcedure[scenario.procedure]||[];

  return <PageShell variant="thematic">
    <section className="hero hero--thematic"><div className="container">
      <nav className="breadcrumb" aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span>/</span>
        <Link href="/temy-zhilishchnogo-prava">Жилищные темы</Link><span>/</span>
        <span aria-current="page">{scenario.title}</span>
      </nav>
      <h1>{scenario.title}</h1>
      <p className="hero-lead">{scenario.summary}</p>
    </div></section>

    <div className="container verified-scenario">
      <section aria-labelledby="verified-scenario-about">
        <h2 id="verified-scenario-about">Что можно проверить</h2>
        <p>{scenario.summary}</p>
        <p>Выберите фактические обстоятельства. Подходящий проект документа появится
          только для заранее проверенного варианта. Даты, адрес и ФИО не запрашиваются
          и не сохраняются.</p>
      </section>

      <VerifiedScenarioIntake scenario={scenario}/>

      <section className="verified-scenario-sources" aria-labelledby="verified-sources-heading">
        <h2 id="verified-sources-heading">Официальные источники</h2>
        <p>Представлены три независимых официальных источника по применимому
          правовому вопросу. Сравнивайте их редакции, исключения и
          условия применимости к обстоятельствам конкретного дела.</p>
        <ul>{sources.map(source=>
          <li key={source.href}><a href={source.href}
            target="_blank" rel="noopener noreferrer">{source.name}</a></li>
        )}</ul>
      </section>

      <nav className="verified-scenario-related" aria-label="Связанные материалы">
        <h2>Связанные разделы</h2>
        <ul>
          <li><Link href="/zayavlenie-v-dgi-moskvy">Обращение в ДГИ Москвы</Link></li>
          <li><Link href="/zhaloba-na-dgi-moskvy">Жалобы на ДГИ</Link></li>
          <li><Link href="/spory-s-dgi">Споры с ДГИ</Link></li>
          <li><Link href="/temy-zhilishchnogo-prava">Вернуться ко всем темам</Link></li>
        </ul>
      </nav>
    </div>
  </PageShell>;
}
