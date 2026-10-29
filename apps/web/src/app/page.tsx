import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/PageShell";
import { canIndexPage, canonicalUrl, getMigratedPage, siteIsLive } from "@/data/pages";
import { getPublishedEditorialPage } from "@/data/published";
import { housingNewsBase, listHousingNews } from "@/data/housing-news";

const topics = [
  { title: "Жилищный учёт", href: "/zhilishchnyj-uchet", detail: "Очередь, постановка и снятие с учёта" },
  { title: "Приватизация", href: "/privatizaciya-zhilya", detail: "Участники, документы и отказ" },
  { title: "Социальный наём", href: "/socialnyj-naem", detail: "Договор, члены семьи и выселение" },
  { title: "Реновация", href: "/renovaciya-pereselenie", detail: "Переселение, договор и гарантии" },
  { title: "Споры с ДГИ", href: "/spory-s-dgi", detail: "Отказ, жалоба и обращение в суд" },
  { title: "Документы на квартиру", href: "/dokumenty-na-kvartiru", detail: "Право собственности и архивные сведения" },
] as const;

const tasks = [
  { title: "Заявление в ДГИ", href: "/zayavlenie-v-dgi-moskvy", detail: "Куда подать и что приложить" },
  { title: "Жалоба на ДГИ", href: "/zhaloba-na-dgi-moskvy", detail: "Как проверить и обжаловать решение" },
  { title: "Судебная практика", href: "/sudebnaya-praktika-dgi", detail: "Поиск дел и судебных актов" },
  { title: "Нормативные акты", href: "/normativnye-akty", detail: "Законы, постановления и регламенты" },
] as const;

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const page = (await getPublishedEditorialPage("")) ?? getMigratedPage("");
  if (!page) return {};
  return {
    title: { absolute: page.seoTitle },
    description: page.description,
    openGraph: {
      type: "website",
      locale: "ru_RU",
      siteName: "Единая справочная служба Москвы — жилищные вопросы",
      title: page.seoTitle,
      description: page.description,
      url: "https://dgi-pravo.ru/",
    },
    twitter: { card: "summary", title: page.seoTitle, description: page.description },
    alternates: canIndexPage(page) ? { canonical: canonicalUrl(page) } : undefined,
    robots: canIndexPage(page) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function HomePage() {
  const page = (await getPublishedEditorialPage("")) ?? getMigratedPage("");
  if (!page) notFound();
  const news = listHousingNews().slice(0, 3);
  return <PageShell variant="home">
    <section className="home-intro">
      <div className="container">
        <h1>Жилищные вопросы в Москве</h1>
        <p>Права, документы и порядок действий. Выберите вопрос, чтобы перейти к нужной правовой информации.</p>
        <a className="home-intro-link" href="#topics">Выбрать тему ↓</a>
      </div>
    </section>
    <section className="topic-section" id="topics">
      <div className="container">
        <h2 className="section-title">Разделы справочника</h2>
        <div className="topic-grid">
          {topics.map(({ title, href, detail }) => <Link className="topic-card" href={href} key={href}>
            <h3>{title}</h3>
            <p>{detail}</p>
            <span className="topic-more">Подробнее →</span>
          </Link>)}
        </div>
      </div>
    </section>
    <section className="home-task-section">
      <div className="container">
        <h2 className="section-title">Документы и обращения</h2>
        <div className="home-task-grid">
          {tasks.map(({ title, href, detail }) => <Link className="home-task-link" href={href} key={href}>
            <strong>{title}</strong><span>{detail}</span><span aria-hidden="true">→</span>
          </Link>)}
        </div>
      </div>
    </section>
    <section className="container home-news-section">
      <div className="home-news-heading"><h2 className="section-title">Новости жилья и недвижимости</h2><Link href={housingNewsBase}>Все новости →</Link></div>
      {news.length ? <div className="housing-news-grid">{news.map(item => <article className="housing-news-card" key={item.slug}>
        <span className="housing-news-meta">{item.region} · {new Date(item.publishedAt).toLocaleDateString("ru-RU",{ timeZone:"Europe/Moscow" })}</span>
        <h3><Link href={housingNewsBase + "/" + item.slug}>{item.title}</Link></h3><p>{item.summary}</p>
      </article>)}</div> : <p>Проверенные материалы готовятся к публикации. <Link href={housingNewsBase}>Перейти в раздел новостей →</Link></p>}
    </section>
  </PageShell>;
}
