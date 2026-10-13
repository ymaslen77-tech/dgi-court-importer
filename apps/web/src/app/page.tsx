import type { Metadata } from 'next';
import Link from 'next/link';
import { Header, Footer } from '../components/site-chrome';
import { routeHref } from '../lib/routes';
import { SITE_NAME, INDEXABLE } from '../lib/site';

export const metadata: Metadata = {
  title: SITE_NAME,
  description: 'Справочная и правовая помощь: приватизация, жилищный учёт, соцнаём, реновация, новости и судебные споры Москвы.',
  alternates: { canonical: '/' },
  robots: { index: INDEXABLE, follow: INDEXABLE },
};

const topics = [
  { n: '01', title: 'Приватизация квартиры', desc: 'Права участников, документы, отказ и обжалование.', slug: 'privatizaciya-zhilya' },
  { n: '02', title: 'Жилищная очередь', desc: 'Постановка на учёт и проверка оснований снятия.', slug: 'zhilishchnaya-ochered' },
  { n: '03', title: 'Социальный наём', desc: 'Договор, состав семьи и возможные споры.', slug: 'socialnyj-naem' },
  { n: '04', title: 'Реновация и переселение', desc: 'Предложения нового жилья, условия и документы.', slug: 'renovaciya-pereselenie' },
  { n: '05', title: 'Жалоба на ДГИ', desc: 'Проверка отказа и выбор порядка обжалования.', slug: 'zhaloba-na-dgi-moskvy' },
  { n: '06', title: 'Судебная практика', desc: 'Каталог дел и проверка судебных первоисточников.', slug: 'sudebnaya-praktika-dgi' },
] as const;

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-inner">
            <p className="eyebrow">НЕЗАВИСИМАЯ СПРАВОЧНО-ПРАВОВАЯ ПОМОЩЬ · МОСКВА</p>
            <h1>Единая справочная служба Москвы <span>по жилищным вопросам.</span></h1>
            <p className="hero-lead">Справочная и правовая помощь в вопросах жилья: приватизация квартир, жилищный учёт, социальный наём, очередь на жильё, реновация, документы о собственности и судебные споры.</p>
            <a className="outline-button" href="#directions">Выбрать направление ↓</a>
          </div>
        </section>
        <section id="directions" className="section">
          <div className="container">
            <p className="eyebrow red">ЖИЛИЩНЫЕ ВОПРОСЫ МОСКВЫ</p>
            <h2>Найдите свою ситуацию. Разберитесь в правах.</h2>
            <p className="section-lead">Изучите документы, алгоритмы и судебную практику. Неперенесённые разделы пока открываются на действующем сайте Webflow.</p>
            <div className="topic-grid">
              {topics.map(({ n, title, desc, slug }) => (
                <Link className="topic-card" key={slug} href={routeHref(slug)}>
                  <span className="number">{n}</span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <span className="card-link">Изучить направление ↗</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="section light-section">
          <div className="container split-info">
            <div>
              <p className="eyebrow red">ПРОВЕРЯЕМЫЕ СВЕДЕНИЯ</p>
              <h2>Закон, документы, судебные источники.</h2>
            </div>
            <div>
              <p>Материалы описывают общий порядок действий и содержат ссылки на нормативные акты. Решения судов не получают статус проверенных без чтения первичного текста акта.</p>
              <Link href="/sudebnaya-praktika-dgi" className="primary-button">Судебная практика →</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
