import { publicCourts } from '@/lib/courts';
import { CourtBrowser } from './court-browser';

export function CourtList() {
  const cases = publicCourts();
  return <section className="court-section" aria-labelledby="court-list-title">
    <div className="section-heading">
      <p className="eyebrow">АРХИВ СУДЕБНОЙ ПРАКТИКИ</p>
      <h2 id="court-list-title">Судебные дела и источники</h2>
      <p>Публикации перенесены с действующего сайта. По большинству карточек требуется
        дополнительная проверка текста судебного акта и истории обжалования.</p>
    </div>
    <CourtBrowser cases={cases} />
  </section>;
}
