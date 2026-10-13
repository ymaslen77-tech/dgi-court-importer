import Link from 'next/link';
import type { Guide as GuideType } from '../lib/editorial';
import { Header, Footer } from './site-chrome';

export function Guide({ guide, source }: { guide: GuideType; source: string }) {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-inner">
            <p className="eyebrow">{guide.eyebrow}</p>
            <h1>{guide.title}</h1>
            <p className="hero-lead">{guide.summary}</p>
            <a href="#steps" className="outline-button">Перейти к инструкции ↓</a>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <p className="eyebrow red">ПРАВОВОЙ КОНТЕКСТ</p>
            <h2>Что важно учитывать</h2>
            {guide.background.map((paragraph) => (
              <p className="article-paragraph" key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </section>
        <section className="section light-section" id="steps">
          <div className="container">
            <p className="eyebrow red">ПОШАГОВЫЙ РАЗБОР</p>
            <h2>Порядок действий</h2>
            <div className="article-grid">
              {guide.steps.map((step, i) => (
                <article className="article-card" key={step.title}>
                  <span className="number">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
            <aside className="dark-panel">
              <h2>Документы для проверки</h2>
              <p>{guide.checklist}</p>
            </aside>
          </div>
        </section>
        <section className="section">
          <div className="container">
            <p className="eyebrow red">ЧАСТЫЙ ВОПРОС</p>
            <h2>{guide.question}</h2>
            <p className="article-paragraph">{guide.answer}</p>
            <h2>Первоисточники</h2>
            <div className="source-links">
              {guide.sources.map(({ title, url }) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer">{title} ↗</a>
              ))}
            </div>
            <p className="fineprint">Текст перенесён из действующего Webflow. Действующую редакцию закона и применимый регламент необходимо проверить перед юридическим использованием.</p>
            <p className="fineprint">Сверить с <a href={source} rel="noopener noreferrer">исходной страницей сайта ↗</a>.</p>
            <Link className="primary-button" href="/">Открыть каталог вопросов →</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
