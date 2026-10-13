import Link from 'next/link';
import { publicCourts } from '@/lib/courts';

export function CourtList() {
  const cases = publicCourts();
  return <section className="court-section" aria-labelledby="court-list-title">
    <div className="section-heading">
      <p className="eyebrow">АРХИВ СУДЕБНОЙ ПРАКТИКИ</p>
      <h2 id="court-list-title">Судебные дела и источники</h2>
      <p>Публикации перенесены с действующего сайта. По большинству карточек требуется
        дополнительная проверка текста судебного акта и истории обжалования.</p>
    </div>
    <div className="court-grid">
      {cases.map((caseItem) => <article key={caseItem.id} className="court-card">
        <span className="meta-line">{caseItem.number || 'Номер уточняется'}</span>
        <h3><Link href={'/dgi-court-cases/' + caseItem.slug}>{caseItem.title}</Link></h3>
        <p>{caseItem.court || 'Суд уточняется'}</p>
        {caseItem.topic && <p className="court-category">{caseItem.topic}</p>}
        <span className="review-note">Оригинал акта требует проверки</span>
      </article>)}
    </div>
  </section>;
}
