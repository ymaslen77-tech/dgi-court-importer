import Link from "next/link";

const navigation = [
  { href: "/funkcii-dgi", label: "О ДГИ" },
  { href: "/privatizaciya-zhilya", label: "Приватизация" },
  { href: "/spory-s-dgi", label: "Жилищные споры" },
  { href: "/sudebnaya-praktika-dgi", label: "Судебная практика" },
  { href: "/novosti-zhilishchnogo-prava", label: "Новости" },
  { href: "/kontakty-dgi", label: "Контакты" },
];

export function PageShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="site">
      <div className="topbar">
        <div className="container">МОСКВА · ЖИЛИЩНОЕ ПРАВО · СПРАВОЧНЫЕ МАТЕРИАЛЫ</div>
      </div>
      <header className="site-header">
        <div className="container header-wrap">
          <Link href="/" className="brand" aria-label="Единая справочная служба Москвы — главная">
            <span className="brand-mark" aria-hidden="true">Е</span>
            <span className="brand-text">
              ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА МОСКВЫ
              <span className="brand-sub">ПО ЖИЛИЩНЫМ ВОПРОСАМ</span>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Основная навигация">
            {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <strong>ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА МОСКВЫ</strong>
            <p>Независимый справочно-правовой ресурс по жилищным вопросам. Перед подачей документов проверяйте действующие правила и официальные источники.</p>
          </div>
          <div className="footer-links">
            <Link href="/normativnye-akty">Нормативные акты</Link>
            <Link href="/zayavlenie-v-dgi-moskvy">Обращения</Link>
            <Link href="/sudebnaya-praktika-dgi">Судебные дела</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
