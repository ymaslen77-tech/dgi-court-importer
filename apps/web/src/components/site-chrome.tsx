import Link from 'next/link';
import { SITE_NAME } from '../lib/site';
import { routeHref } from '../lib/routes';

const nav = [
  ['Приватизация', 'privatizaciya-zhilya'],
  ['Жалобы на ДГИ', 'zhaloba-na-dgi-moskvy'],
  ['Контакты', 'kontakty-dgi'],
  ['Судебная практика', 'sudebnaya-praktika-dgi'],
] as const;

export function Header() {
  return (
    <>
      <div className="topline">МОСКВА · НЕЗАВИСИМЫЙ СПРАВОЧНО-ПРАВОВОЙ ПРОЕКТ</div>
      <header className="site-header container">
        <Link className="brand" href="/" aria-label="На главную">
          <span className="brand-mark" aria-hidden="true">Е</span>
          <span>{SITE_NAME}</span>
        </Link>
        <nav className="header-links" aria-label="Основное меню">
          {nav.map(([label, slug]) => (
            <Link key={slug} href={routeHref(slug)}>{label}</Link>
          ))}
        </nav>
      </header>
    </>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container foot-container">
        <div>
          <strong>{SITE_NAME}</strong>
          <p>Независимый справочно-правовой ресурс. Не является государственным органом.</p>
        </div>
        <Link href="/">На главную ↑</Link>
      </div>
    </footer>
  );
}
