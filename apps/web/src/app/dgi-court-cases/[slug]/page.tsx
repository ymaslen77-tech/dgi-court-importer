import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { legacyCases } from "@/data/courts";

type Props = {params: Promise<{slug:string}>};
export const dynamic = "force-dynamic";

// Only formerly public, secondary-source Webflow case references.
// Do not assert an outcome, person, legal reasoning, or verified case act.
export function generateStaticParams() {
  return legacyCases.map(c=>({slug:c.slug}));
}
export async function generateMetadata({params}:Props): Promise<Metadata> {
  const {slug}=await params;
  const entry=legacyCases.find(c=>c.slug===slug);
  if(!entry)return {robots:{index:false,follow:false}};
  return {
    title: {absolute:`Дело № ${entry.caseNumber} — архивная карточка, сведения не проверены`},
    description:"Справочные сведения о деле. Результат и история рассмотрения требуют проверки по официальным судебным актам.",
    robots:{index:false,follow:false},
  };
}
export default async function LegacyCourtCasePage({params}:Props){
  const {slug}=await params;
  const entry=legacyCases.find(c=>c.slug===slug);
  if(!entry || entry.verifiedAct !== false)notFound();
  return <PageShell>
    <section className="hero">
      <div className="container">
        <div className="hero-eyebrow">СУДЕБНОЕ ДЕЛО · АРХИВНЫЕ СВЕДЕНИЯ</div>
        <h1>Дело № {entry.caseNumber}</h1>
        <p className="hero-lead">Архивная информация, не подтверждённая полным текстом судебного акта.</p>
      </div>
    </section>
    <section className="article-section">
      <div className="container legacy-case-detail">
        <h2 className="article-h2">Известные сведения</h2>
        <dl>
          <div><dt>Суд по архивной записи</dt><dd>{entry.court || "Требует проверки"}</dd></div>
          <div><dt>Категория</dt><dd>{entry.category || "Требует проверки"}</dd></div>
          <div><dt>Источник карточки</dt><dd>Справочные сведения из ранее опубликованной карточки</dd></div>
          <div><dt>Судебный акт</dt><dd>Текст решения не проверен по официальному первоисточнику</dd></div>
          <div><dt>Результат рассмотрения</dt><dd>Не подтверждён</dd></div>
          <div><dt>История пересмотра</dt><dd>Не подтверждена</dd></div>
        </dl>
        <p className="article-p">Номер дела, суд и категория отражают прежнюю карточку; это не подтверждение существования или содержания конкретного решения. Для юридически значимых выводов необходимы официальный акт и сведения о пересмотре.</p>
        <Link href="/sudebnaya-praktika-dgi" className="solid-button">К каталогу судебной практики →</Link>
      </div>
    </section>
  </PageShell>;
}
