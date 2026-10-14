import Link from "next/link";

const navigation = [
  { href: "/funkcii-dgi", label: "О ДГИ" },
  { href: "/privatizaciya-zhilya", label: "Приватизация" },
  { href: "/spory-s-dgi", label: "Жилищные споры" },
  { href: "/sudebnaya-praktika-dgi", label: "Судебная практика" },
  { href: "/novosti-zhilishchnogo-prava", label: "Новости" },
  { href: "/kontakty-dgi", label: "Контакты" },
];

const homeNavigation = [
  { href: "/#services", label: "Услуги" },
  { href: "/funkcii-dgi", label: "Каталог ДГИ" },
  { href: "/#material", label: "Порядок работы" },
  { href: "/normativnye-akty", label: "Источники" },
  { href: "/sudebnaya-praktika-dgi", label: "Судебная практика" },
  { href: "/novosti-zhilishchnogo-prava", label: "Новости" },
];

const thematicNavigation = [
  { href: "/", label: "Главная" },
  { href: "/zhilishchnyj-uchet", label: "Жилищный учёт" },
  { href: "/privatizaciya-zhilya", label: "Приватизация" },
  { href: "/socialnyj-naem", label: "Социальный наём" },
  { href: "/renovaciya-pereselenie", label: "Реновация" },
  { href: "/funkcii-dgi", label: "Функции ДГИ" },
  { href: "/normativnye-akty", label: "Нормативные акты" },
  { href: "/gosuslugi-dgi", label: "Госуслуги" },
];

export function PageShell({ children, variant = "default" }: Readonly<{ children: React.ReactNode; variant?: "default" | "home" | "thematic" }>) {
  return (
    <div className={`site site--${variant}`}>
      <a href="#main-content" className="skip-link">Перейти к основному содержанию</a>
      <div className="topbar">
        <div className="container">{variant === "thematic" ? "ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА МОСКВЫ · ЖИЛИЩНЫЕ ВОПРОСЫ · СПРАВОЧНО-ПРАВОВАЯ ПОМОЩЬ" : "МОСКВА · ЖИЛИЩНОЕ ПРАВО · СПРАВОЧНЫЕ МАТЕРИАЛЫ"}</div>
      </div>
      <header className="site-header">
        <div className="container header-wrap">
          <Link href="/" className="brand" aria-label="Единая справочная служба Москвы — главная">
            <span className="brand-mark" aria-hidden="true">{variant === "home" ? "ЖК" : "Е"}</span>
            <span className="brand-text">
              ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА МОСКВЫ
              <span className="brand-sub">ПО ЖИЛИЩНЫМ ВОПРОСАМ</span>
            </span>
          </Link>
          <nav className="main-nav" aria-label="Основная навигация">
            {(variant === "home" ? homeNavigation : variant === "thematic" ? thematicNavigation : navigation).map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
          {variant === "home" && <Link className="header-cta" href="/#services">РАЗОБРАТЬ СИТУАЦИЮ →</Link>}
        </div>
      </header>
      {variant === "thematic" && <div className="thematic-utility">
        <div className="container thematic-utility-inner">
          <Link href="/">← Вернуться к каталогу</Link>
          <span>Редакционный материал · перед применением требуется сверка источников</span>
        </div>
      </div>}
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
