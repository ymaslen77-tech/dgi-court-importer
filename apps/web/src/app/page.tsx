import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { MigratedArticle } from "@/components/MigratedArticle";
import { canIndexPage, canonicalUrl, getMigratedPage, siteIsLive } from "@/data/pages";
import { notFound } from "next/navigation";
import { getPublishedEditorialPage } from "@/data/published";
import type { Metadata } from "next";

const topics = [
  ["Приватизация жилья", "/privatizaciya-zhilya", "Права участников, документы и обжалование отказов"],
  ["Социальный наём", "/socialnyj-naem", "Права нанимателя и членов семьи"],
  ["Жилищный учёт", "/zhilishchnyj-uchet", "Нуждаемость, очередь и снятие с учёта"],
  ["Реновация", "/renovaciya-pereselenie", "Переселение, договоры и гарантии"],
  ["Споры с ДГИ", "/spory-s-dgi", "Решения ведомства и способы обжалования"],
  ["Судебная практика", "/sudebnaya-praktika-dgi", "Карточки дел, инстанции и первоисточники"],
] as const;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = (await getPublishedEditorialPage("")) ?? (!siteIsLive ? getMigratedPage("") : undefined);
  if (!page) return {};
  return {
    title: { absolute: page.seoTitle },
    description: page.description,
    alternates: canIndexPage(page) ? { canonical: canonicalUrl(page) } : undefined,
    robots: canIndexPage(page) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function HomePage() {
  const page = (await getPublishedEditorialPage("")) ?? (!siteIsLive ? getMigratedPage("") : undefined);
  if (!page) notFound();
  return (
    <PageShell variant="home">
      <MigratedArticle page={page} home afterHero={
        <section className="topic-section" id="services">
        <div className="container">
          <p className="section-eyebrow">ВЫБЕРИТЕ СВОЙ ВОПРОС</p>
          <h2 className="section-title">Практические жилищные маршруты</h2>
          <div className="topic-grid">
            {topics.map(([name, href, desc], index) => (
              <Link href={href} className="topic-card" key={href}>
                <span className="topic-number">{String(index + 1).padStart(2, "0")}</span>
                <h3>{name}</h3>
                <p>{desc}</p>
                <span className="topic-more">ОТКРЫТЬ РАЗДЕЛ →</span>
              </Link>
            ))}
          </div>
        </div>
        </section>
      } />
    </PageShell>
  );
}
