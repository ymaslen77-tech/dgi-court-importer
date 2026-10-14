import Link from "next/link";
import raw from "@/data/housing-guides.json";
import { getMigratedPage, type MigratedPage } from "@/data/pages";

type Source = { label: string; url: string; note: string };
export type HousingGuide = { slug: string; title: string; summary: string; legal: string; documents: string[]; steps: string[]; objection: string; sources: Source[]; related: string[]; stage: string; jurisdiction: string };
type Supplement = {slug: string; intro: string; steps: string[]; sources: Source[]; related: string[] };
export const housingGuides: HousingGuide[] = raw.guides;
const supplements: Supplement[] = raw.supplements;

export function findHousingGuide(slug: string): HousingGuide | undefined {
  return housingGuides.find(guide => guide.slug === slug);
}
const isSafeSource = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password &&
      ["mos.ru","www.mos.ru","fr.mos.ru","cdn.dom.gosuslugi.ru","rosreestr.gov.ru","www.gosuslugi.ru","www.mosgorbti.ru","tender.mos.ru"].includes(parsed.hostname);
  } catch { return false; }
};
function SourceLinks({ sources }: { sources: Source[] }) {
  return <ul className="housing-source-list">{sources.filter(source => isSafeSource(source.url)).map(source =>
    <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a><p>{source.note}</p></li>
  )}</ul>;
}
function Related({ slugs }: { slugs: string[] }) {
  return <nav className="housing-related" aria-label="Связанные материалы">
    {slugs.map(slug => {
      const guide = findHousingGuide(slug);
      const page = getMigratedPage(slug);
      if (!guide && !page) return null;
      return <Link key={slug} href={`/${slug}`}>{guide?.title ?? page?.title} →</Link>;
    })}
  </nav>;
}
export function HousingGuideArticle({ guide }: { guide: HousingGuide }) {
  return <article className="housing-guide">
    <p className="housing-review-label">Редакционный черновик · не прошёл юридическую приёмку</p>
    <h1>{guide.title}</h1>
    <p className="housing-guide-lead">{guide.summary}</p>
    <section><h2>Правовые основания</h2><p>{guide.legal}</p></section>
    <section><h2>Какие документы проверить</h2><ul>{guide.documents.map((item,index)=><li key={index}>{item}</li>)}</ul></section>
    <section><h2>Порядок действий</h2><ol>{guide.steps.map((item,index)=><li key={index}>{item}</li>)}</ol></section>
    <section><h2>Отказ и обжалование</h2><p>{guide.objection}</p></section>
    <section><h2>Сроки и актуальность</h2><p>Срок подачи, рассмотрения, жалобы и обращения в суд зависит от конкретной процедуры и действующей редакции регламента. До юридической проверки этой страницы универсальный срок не приводится.</p></section>
    <section><h2>Официальные источники и ограничения</h2><SourceLinks sources={guide.sources}/></section>
    <section><h2>Связанные темы</h2><Related slugs={guide.related}/></section>
    <p className="housing-editorial-foot">Сведения предназначены для ознакомления. Страница не подтверждает актуальную редакцию перечисленных актов или право конкретного заявителя на услугу.</p>
  </article>;
}
export function HousingSupplement({ page }: { page: MigratedPage }) {
  const supplement = supplements.find(item => item.slug === page.slug);
  if (!supplement) return null;
  return <section className="housing-guide housing-supplement" aria-label="Дополнительная практическая инструкция">
    <p className="housing-review-label">Дополнительная инструкция · редакционный черновик</p>
    <h2>Как решить вопрос: первые действия</h2><p>{supplement.intro}</p>
    <ol>{supplement.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>
    <h3>Официальные источники</h3><SourceLinks sources={supplement.sources}/>
    <h3>Смежные вопросы</h3><Related slugs={supplement.related}/>
  </section>;
}
