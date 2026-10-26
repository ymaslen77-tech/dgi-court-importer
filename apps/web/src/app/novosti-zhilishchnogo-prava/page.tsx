import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { siteIsLive } from "@/data/pages";
import { housingNewsBase, listHousingNews } from "@/data/housing-news";

export const metadata: Metadata = {
  title: { absolute: "Новости недвижимости и жилищного права Москвы и Подмосковья" },
  description: "Новости о жилье, реновации, недвижимости и ЖКХ Москвы и Московской области с датами и ссылками на официальные источники.",
  alternates: siteIsLive ? { canonical: "https://dgi-pravo.ru/novosti-zhilishchnogo-prava" } : undefined,
  robots: { index: siteIsLive, follow: siteIsLive },
};
const fmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" });

export default function HousingNewsPage() {
  const items = listHousingNews();
  return <PageShell variant="thematic">
    <section className="hero hero--thematic"><div className="container">
      <nav className="breadcrumb" aria-label="Навигационная цепочка"><Link href="/">Главная</Link><span aria-hidden="true">/</span><span>Новости</span></nav>
      <h1>Новости жилья и недвижимости</h1>
      <p className="hero-lead">Москва и Московская область. Проверяемые факты, ссылки на источники и полезные сведения для жителей.</p>
    </div></section>
    <section className="container housing-news-section">
      <div className="housing-news-bar"><h2>Последние публикации</h2><p>{items.length ? "Сначала новые" : "Проверенные новости готовятся к публикации."}</p></div>
      {items.length ? <div className="housing-news-grid">{items.map(article => <article key={article.slug} className="housing-news-card">
        <div className="housing-news-meta"><span>{article.region} · {article.category}</span>
          <time dateTime={article.publishedAt}>{fmt.format(new Date(article.publishedAt))}</time></div>
        <h3><Link href={housingNewsBase + "/" + article.slug}>{article.title}</Link></h3>
        <p>{article.summary}</p><Link className="housing-news-more" href={housingNewsBase + "/" + article.slug}>Читать статью →</Link>
      </article>)}</div> : <p className="housing-news-empty">Пока нет статей, прошедших проверку источника. Редакционный отбор продолжается.</p>}
    </section>
  </PageShell>;
}
