import type { Metadata } from 'next';
import Link from 'next/link';
import { getPage, getPages, topicCards } from '@/lib/webflow';
import { SourceContent } from '@/components/source-content';
import { canonicalUrl } from '@/lib/site';

const page = getPage('');
export const metadata: Metadata = {
  title: page?.seo.title || 'Жилищные вопросы Москвы',
  description: page?.seo.description || 'Пошаговые инструкции по жилищным вопросам Москвы.',
  alternates: { canonical: canonicalUrl('/') },
};

export default function Home() {
  if (!page) return null;
  return <>
    <section className="hero home-hero">
      <div className="container">
        <span className="eyebrow">СПРАВОЧНАЯ СЛУЖБА / МОСКВА</span>
        <h1>Жилищные вопросы.<br/><span>Практические ответы.</span></h1>
        <p className="hero-copy">Справочная и правовая помощь в вопросах жилья: приватизация,
          жилищный учёт, социальный наём, реновация, документы на квартиру
          и судебная практика. Выберите свою ситуацию.</p>
        <Link href="#topics" className="button-primary">Выбрать свой вопрос <span aria-hidden="true">↓</span></Link>
      </div>
    </section>
    <section className="section section-light" id="topics">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">01 / ПРАКТИЧЕСКИЕ ЮРИДИЧЕСКИЕ МАРШРУТЫ</p>
          <h2>Начните с вашей ситуации</h2>
          <p>Руководства основаны на существующих материалах сайта и содержат ссылки на источники.</p>
        </div>
        <div className="topic-grid">
          {topicCards.map((topic) => <Link className="topic-card" href={topic.href} key={topic.href}>
            <span className="card-number">{topic.number}</span>
            <h3>{topic.title}</h3>
            <p>{topic.desc}</p>
            <span className="card-action">К инструкции <span aria-hidden="true">↗</span></span>
          </Link>)}
        </div>
      </div>
    </section>
    <section className="section section-dark">
      <div className="container split-content">
        <div><p className="eyebrow">02 / СПРАВОЧНИК ПО ДГИ МОСКВЫ</p>
          <h2>Документы. Обращения. Защита прав.</h2>
          <p>Порядок подачи заявлений, поиск решений и нормативных актов,
             жалобы и судебная практика — с указанием первоисточников.</p></div>
        <div className="link-stack">
          <Link href="/zayavlenie-v-dgi-moskvy">Подать заявление в ДГИ <span aria-hidden="true">↗</span></Link>
          <Link href="/zhaloba-na-dgi-moskvy">Обжаловать отказ <span aria-hidden="true">↗</span></Link>
          <Link href="/sudebnaya-praktika-dgi">Найти судебное дело <span aria-hidden="true">↗</span></Link>
          <Link href="/normativnye-akty">Проверить нормативный акт <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
    <section className="section section-light">
      <div className="container">
        <div className="section-heading">
          <p className="eyebrow">03 / ВСЕ ТЕМЫ</p>
          <h2>Каталог справочных разделов</h2>
        </div>
        <div className="directory-grid">
          {getPages().filter((x) => x.slug).map((x) =>
            <Link href={'/' + x.slug} key={x.slug}>{x.title}<span aria-hidden="true">↗</span></Link>)}
        </div>
      </div>
    </section>
    <section className="section section-light original-copy">
      <div className="container">
        <div className="section-heading"><p className="eyebrow">ИСХОДНЫЕ МАТЕРИАЛЫ WEBFLOW</p>
          <h2>Дополнительная справочная информация</h2></div>
        <SourceContent page={page} />
      </div>
    </section>
  </>;
}
