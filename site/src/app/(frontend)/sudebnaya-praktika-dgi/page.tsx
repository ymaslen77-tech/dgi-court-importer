import type { Metadata } from 'next'
import Link from 'next/link'
import { isOfficialCourtLink } from '@/lib/official-link'
import { caseSeed } from '@/lib/case-seed'
export const metadata: Metadata = { title: 'Судебная практика ДГИ Москвы', description: 'Каталог официальных карточек жилищных дел Москвы. Даты, решения и правовые позиции требуют проверки первоисточников.', robots: { index: false, follow: false } }
export default function CourtPracticePage() {
  return <main><section className="hero"><div className="shell"><div className="overline">СУДЕБНАЯ ПРАКТИКА · МОСКВА</div><h1>Каталог судебных <em>дел и источников.</em></h1><p>Это демонстрационный индекс карточек дел. Факты из судебных актов и результаты рассмотрения не опубликованы без проверки.</p></div></section>
    <section className="section"><div className="shell"><div className="notice">Все записи ниже — метаданные-кандидаты. Наличие карточки не означает, что судебный акт изучен, дело окончено или правовая позиция подтверждена.</div><div className="cards">{caseSeed.map(c => <article className="tile" key={c.id}><strong>{c.category}</strong><h3>Дело № {c.number}</h3><p>{c.court}</p>{isOfficialCourtLink(c.official_case_url) && <a className="text-link" href={c.official_case_url} target="_blank" rel="noopener noreferrer">Официальная карточка суда ↗</a>}</article>)}</div><p className="section-lead">Дальнейший этап — индекс PostgreSQL, фильтры по УИД/инстанции и редакционная проверка актов.</p><Link href="/" className="btn-outline">НА ГЛАВНУЮ →</Link></div></section></main>
}
