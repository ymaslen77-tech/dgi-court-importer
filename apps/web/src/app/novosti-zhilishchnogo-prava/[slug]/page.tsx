import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { siteIsLive } from "@/data/pages";
import { getHousingNews, housingNewsBase, listHousingNews } from "@/data/housing-news";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

const fmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" });
export function generateStaticParams() { return listHousingNews().map(article => ({ slug: article.slug })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getHousingNews(slug);
  if (!article) return { robots: { index: false, follow: false } };
  return {
    title: { absolute: article.title + " — Новости недвижимости Москвы и области" },
    description: article.summary,
    alternates: siteIsLive ? { canonical: "https://dgi-pravo.ru" + housingNewsBase + "/" + slug } : undefined,
    robots: { index: siteIsLive, follow: siteIsLive },
    openGraph: { type: "article", title: article.title, description: article.summary, publishedTime: article.publishedAt },
  };
}
export default async function HousingNewsStory({ params }: Props) {
  const { slug } = await params;
  const article = getHousingNews(slug);
  if (!article) notFound();
  const url = "https://dgi-pravo.ru" + housingNewsBase + "/" + article.slug;
  // Factual fields only: never invent author, editorial update date or image.
  const structuredData = siteIsLive ? JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "NewsArticle", "@id": url + "#article",
        mainEntityOfPage: url, headline: article.title, description: article.summary,
        datePublished: article.publishedAt, inLanguage: "ru", isBasedOn: article.sourceUrl },
      { "@type": "BreadcrumbList", "@id": url + "#breadcrumb",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Главная", item: "https://dgi-pravo.ru/" },
          { "@type": "ListItem", position: 2, name: "Новости", item: "https://dgi-pravo.ru" + housingNewsBase },
          { "@type": "ListItem", position: 3, name: article.title, item: url },
        ],
      },
    ],
  }).replace(/</g,"\\u003c").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029") : "";
  return <PageShell variant="thematic">
    {structuredData && <script type="application/ld+json"
      dangerouslySetInnerHTML={{__html:structuredData}} />}
    <section className="hero hero--thematic"><div className="container">
      <nav className="breadcrumb" aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span>/</span><Link href={housingNewsBase}>Новости</Link>
      </nav>
      <h1>{article.title}</h1>
      <p className="hero-lead">{article.summary}</p>
    </div></section>
    <article className="container housing-news-article">
      <div className="housing-news-meta"><span>{article.region} · {article.category}</span>
        <time dateTime={article.publishedAt}>Опубликовано: {fmt.format(new Date(article.publishedAt))}</time></div>
      {article.sections.map((section, i) => <section key={i}>
        <h2>{section.heading}</h2>
        {section.paragraphs.map((p, j) => <p key={j}>{p}</p>)}
      </section>)}
      <aside className="housing-news-source">
        <strong>Проверяемый источник</strong>
        <p>Источник: {article.sourceName}. Дата исходной публикации: {fmt.format(new Date(article.sourcePublishedAt))}.</p>
        <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer">Открыть исходное сообщение ↗</a>
      </aside>
      <p className="housing-news-return"><Link href={housingNewsBase}>← Все новости</Link></p>
    </article>
  </PageShell>;
}
