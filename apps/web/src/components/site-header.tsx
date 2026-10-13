import Link from 'next/link';
import { primaryNav } from '@/lib/webflow';

export function SiteHeader() {
  return <header className="site-header">
    <div className="masthead container">
      <Link className="brand" href="/" aria-label="Единая справочная служба Москвы — главная">
        <span className="brand-square" aria-hidden="true">Е</span>
        <span className="brand-name">ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА
          <span className="brand-caption">МОСКВА · ЖИЛИЩНЫЕ ВОПРОСЫ</span>
        </span>
      </Link>
      <nav className="desktop-nav" aria-label="Главная навигация">
        {primaryNav.map(({ label, href }) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <details className="mobile-nav">
        <summary>Разделы <span aria-hidden="true">☰</span></summary>
        <nav aria-label="Мобильная навигация">
          {primaryNav.map(({ label, href }) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
      </details>
    </div>
  </header>;
}

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="container footer-grid">
      <div>
        <strong>ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА МОСКВЫ</strong>
        <p>Независимый справочно-правовой информационный портал по жилищным вопросам.</p>
      </div>
      <nav aria-label="Информация">
        <Link href="/funkcii-dgi">ДГИ Москвы</Link>
        <Link href="/kontakty-dgi">Контакты ДГИ</Link>
        <Link href="/normativnye-akty">Законодательство</Link>
        <Link href="/novosti-zhilishchnogo-prava">Новости</Link>
      </nav>
    </div>
  </footer>;
}
