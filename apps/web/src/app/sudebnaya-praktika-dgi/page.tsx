import type { Metadata } from 'next';
import { Header, Footer } from '../../components/site-chrome';
import { loadCandidates } from '../../lib/court-catalog';

export const metadata: Metadata = {
  title: 'Судебная практика ДГИ Москвы — кандидаты на проверку',
  description: 'Номера дел и ссылки на официальные карточки судебного делопроизводства. Исходы решений не подтверждены.',
  robots: { index: false, follow: false },
};

export default async function CourtCasesPage() {
  const cases = await loadCandidates();
  return (
    <>
      <Header />
      <main>
        <section className="hero"><div className="container hero-inner">
          <p className="eyebrow">СУДЕБНАЯ ПРАКТИКА / МОСКВА</p>
          <h1>Судебные дела <span>на редакционной проверке.</span></h1>
          <p className="hero-lead">Это предварительные метаданные официальных карточек дел. Результаты, мотивировка и дальнейший пересмотр не подтверждены.</p>
        </div></section>
        <section className="section"><div className="container">
          <h2>Каталог кандидатов — {cases.length}</h2>
          <p className="section-lead">Судебные акты появятся в опубликованной базе только после сверки первоисточников. Совпадающие УИД разных инстанций требуют редакционной проверки.</p>
          <div className="topic-grid">
            {cases.map((c) => (
              <article className="topic-card" key={c.id}>
                <p className="eyebrow red">НЕПРОВЕРЕННЫЙ СУДЕБНЫЙ АКТ</p>
                <h3>Дело № {c.number}</h3>
                <p>{c.court}</p>
                <p>{c.category}</p>
                <a href={c.official_case_url} rel="noopener noreferrer" target="_blank" className="card-link">Официальная карточка суда ↗</a>
              </article>
            ))}
          </div>
          {cases.length === 0 && <p>Данные каталога пока не импортированы. Проверьте подключение файла судебных метаданных.</p>}
        </div></section>
      </main>
      <Footer />
    </>
  );
}
