import type { Metadata } from 'next'
import Link from 'next/link'
import { legacyPages } from '@/lib/legacy-pages'
import { indexingEnabled } from '@/lib/site'
const featured = ['privatizaciya-zhilya','socialnyj-naem','renovaciya-pereselenie','spory-s-dgi','zayavlenie-v-dgi-moskvy','sudebnaya-praktika-dgi','novosti-zhilishchnogo-prava','kontakty-dgi']
export const metadata: Metadata = {
  title: 'Жилищные вопросы Москвы — справочно-правовая информация',
  robots: { index: indexingEnabled, follow: indexingEnabled },
}
export default function Home() {
  const pages = featured.map(slug => legacyPages.find(p => p.slug === slug)).filter(p => p !== undefined)
  return <main>
    <section className="hero"><div className="shell"><div className="overline">СПРАВОЧНАЯ ПРАВОВАЯ ИНФОРМАЦИЯ / МОСКВА</div><h1>Жилищные вопросы Москвы. <em>Понятные маршруты решения.</em></h1><p>Приватизация, городской жилищный фонд, реновация, ДГИ, судебная практика и документы — в единой структуре.</p><Link className="btn" href="/spory-s-dgi">ВЫБРАТЬ ПРАВОВУЮ СИТУАЦИЮ →</Link></div></section>
    <section className="section"><div className="shell"><div className="overline">РАЗДЕЛЫ ПОРТАЛА</div><h2>Найдите нужную инструкцию</h2><div className="cards">{pages.map(page => <Link key={page.slug} className="tile" href={'/' + page.slug}><h3>{page.title}</h3><p>{page.seoDescription || 'Справочная информация по жилищным вопросам Москвы.'}</p><strong>ПЕРЕЙТИ →</strong></Link>)}</div></div></section>
    <section className="section muted"><div className="shell"><div className="overline">СТАТУС ПЕРЕНОСА</div><h2>Существующие адреса сохранены</h2><p className="section-lead">Пока проверяется юридическое содержание, соответствующие материалы доступны на действующем сайте Webflow. Новая версия не заменяет первоисточник до редакционной приёмки.</p></div></section>
  </main>
}
