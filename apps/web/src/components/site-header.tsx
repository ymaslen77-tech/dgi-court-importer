import Link from "next/link";

const navigation = [
  { href: "/funkcii-dgi", label: "О ДГИ" },
  { href: "/privatizaciya-zhilya", label: "Жилищные вопросы" },
  { href: "/sudebnaya-praktika-dgi", label: "Судебная практика" },
  { href: "/novosti-zhilishchnogo-prava", label: "Новости" },
  { href: "/kontakty-dgi", label: "Контакты" },
];

export function SiteHeader() {
  return (
    <>
      <div className="top-strip">МОСКВА · ЖИЛИЩНОЕ ПРАВО · СПРАВОЧНЫЕ МАТЕРИАЛЫ</div>
      <header className="site-header">
        <div className="wrap nav-inner">
          <Link href="/" className="brand" aria-label="Единая справочная служба Москвы — главная">
            <span className="brand-symbol" aria-hidden="true">Е</span>
            <span>ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА<small>МОСКВА · ЖИЛИЩНЫЕ ВОПРОСЫ</small></span>
          </Link>
          <nav className="navigation" aria-label="Основная навигация">
            {navigation.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          </nav>
        </div>
      </header>
    </>
  );
}
