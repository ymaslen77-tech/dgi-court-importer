import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { defaultRobots, serviceName } from '@/lib/site'
export const metadata: Metadata = {
  title: { default: serviceName, template: '%s | Жилищные вопросы Москвы' },
  description: 'Независимая справочно-правовая информация по жилищным вопросам Москвы.',
  robots: defaultRobots,
}
export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ru"><body>
    <div className="utility-bar">МОСКВА · ЖИЛИЩНЫЕ ВОПРОСЫ · ПРАВОВАЯ ИНФОРМАЦИЯ</div>
    <header className="site-header shell"><Link className="brand" href="/">ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА<br/><span>МОСКВЫ · ЖИЛИЩНЫЕ ВОПРОСЫ</span></Link>
      <nav aria-label="Разделы"><Link href="/funkcii-dgi">ДГИ Москвы</Link><Link href="/sudebnaya-praktika-dgi">Судебная практика</Link><Link href="/novosti-zhilishchnogo-prava">Новости</Link><Link href="/kontakty-dgi">Контакты</Link></nav>
    </header>
    {children}
    <footer className="site-footer"><div className="shell"><p className="footer-title">ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА МОСКВЫ</p><p>Независимая справочно-правовая информация. Проверяйте актуальность нормативных актов.</p></div></footer>
  </body></html>
}
