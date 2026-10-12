import Link from "next/link";
import type { Metadata } from "next";
import { robotsRule } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Жилищные вопросы Москвы — справочно-правовая помощь",
  description: "Порядок приватизации, жилищного учёта, соцнайма, реновации, заявлений в ДГИ и поиска судебных дел.",
  robots: robotsRule,
  alternates: { canonical: "/" },
};

const topics = [
  { title: "Приватизация жилья", text: "Участники, документы и основания отказа.", href: "/privatizaciya-zhilya" },
  { title: "Социальный наём", text: "Права семьи, договор и споры о пользовании.", href: "/socialnyj-naem" },
  { title: "Жилищный учёт", text: "Очередь на жильё и порядок обжалования.", href: "/zhilishchnyj-uchet" },
  { title: "Реновация", text: "Предоставление квартиры и проверка документов.", href: "/renovaciya-pereselenie" },
  { title: "Заявления в ДГИ", text: "Подача обращения и проверка ответа.", href: "/zayavlenie-v-dgi-moskvy" },
  { title: "Жалобы на ДГИ", text: "Отказы, документы и способы защиты.", href: "/zhaloba-na-dgi-moskvy" },
  { title: "Аренда земли", text: "Аукционы, договоры и документы.", href: "/arenda-zemli-dgi-moskvy" },
  { title: "Городские торги", text: "Квартиры, участки и имущество Москвы.", href: "/torgi-dgi-moskvy" },
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="wrap hero-content">
          <p className="eyebrow">ЖИЛИЩНЫЕ ВОПРОСЫ / МОСКВА</p>
          <h1>Единая справочная служба Москвы <span>по жилищным вопросам.</span></h1>
          <p className="hero-intro">Разбираем процедуры, документы и правовые основания: от приватизации и реновации до жалоб и судебной практики.</p>
          <div className="hero-actions">
            <Link className="button button-red" href="#topics">НАЙТИ СВОЮ СИТУАЦИЮ <span aria-hidden="true">→</span></Link>
            <Link className="button button-dark" href="/sudebnaya-praktika-dgi">СУДЕБНАЯ ПРАКТИКА <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>
      <section className="section" id="topics">
        <div className="wrap">
          <p className="eyebrow eyebrow-light">ЮРИДИЧЕСКИЕ МАРШРУТЫ</p>
          <h2 className="section-title">Найдите ответ на жилищный вопрос.</h2>
          <p className="section-lead">Выберите ситуацию. Внутри — сохранённые материалы действующего сайта и ссылки на документы.</p>
          <div className="topic-grid">{topics.map((topic, index) =>
            <Link className="topic-card" key={topic.href} href={topic.href}>
              <span className="topic-number">{String(index + 1).padStart(2, "0")}</span>
              <h3>{topic.title}</h3><p>{topic.text}</p><span className="card-arrow">ОТКРЫТЬ РАЗДЕЛ ↗</span>
            </Link>)}</div>
        </div>
      </section>
      <section className="feature-section">
        <div className="wrap feature-content">
          <div><p className="eyebrow">СУДЕБНЫЕ ДЕЛА / МОСКВА</p><h2>Судебная практика с проверяемыми источниками.</h2><p>На первом этапе доступен каталог официальных карточек-кандидатов. Тексты и результаты решений публикуются только после сверки.</p></div>
          <Link className="button button-red" href="/sudebnaya-praktika-dgi">ИСКАТЬ ДЕЛА →</Link>
        </div>
      </section>
    </main>
  );
}
