import Link from "next/link";
import { siteIsLive } from "@/data/pages";

const navigation = [
  { href: "/", label: "Главная" },
  { href: "/zhilishchnyj-uchet", label: "Жилищный учёт" },
  { href: "/privatizaciya-zhilya", label: "Приватизация" },
  { href: "/socialnyj-naem", label: "Социальный наём" },
  { href: "/renovaciya-pereselenie", label: "Реновация" },
  { href: "/spory-s-dgi", label: "Споры с ДГИ" },
  { href: "/normativnye-akty", label: "Законы" },
  { href: "/sudebnaya-praktika-dgi", label: "Судебные дела" },
];

const previewOnlyLinks = [
  ...(!siteIsLive ? [{ href: "/reestr-gosuslug-dgi", label: "Реестр услуг" },
    { href: "/osvobodivshayasya-komnata-v-kommunalnoy-kvartire", label: "Коммунальные квартиры" },
    { href: "/specializirovannyy-zhilishchnyy-fond", label: "Спецжилфонд" }] : []),
];

export function PageShell({ children, variant = "default" }: Readonly<{
  children: React.ReactNode;
  variant?: "default" | "home" | "thematic";
}>) {
  return (
    <div className={`site site--${variant}`}>
      <a href="#main-content" className="skip-link">К содержанию</a>
      <div className="topbar"><div className="container">
        Единая справочная служба Москвы по жилищным вопросам
      </div></div>
      <header className="site-header">
        <div className="container header-wrap">
          <Link href="/" className="brand" aria-label="На главную">
            <span className="brand-text">Жилищный справочник Москвы</span>
          </Link>
          <nav className="main-nav" aria-label="Основные разделы">
            {navigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
          </nav>
        </div>
      </header>
      <main id="main-content">{children}</main>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <strong>Единая справочная служба Москвы по жилищным вопросам</strong>
            <p>Независимый информационно-правовой справочник. Не является официальным сайтом или подразделением ДГИ Москвы и не оказывает государственные услуги.</p>
            <p className="footer-disclaimer">Материалы носят справочный характер. Перед обращением проверяйте действующую редакцию нормативных актов, сроки и документы в официальных источниках.</p>
            <p><a href="https://www.mos.ru/dgi/" target="_blank" rel="noopener noreferrer">Официальный сайт ДГИ Москвы ↗</a></p>
          </div>
          <nav className="footer-links" aria-label="Дополнительная информация">
            <Link href="/funkcii-dgi">Функции ДГИ</Link>
            <Link href="/gosuslugi-dgi">Государственные услуги</Link>
            <Link href="/zayavlenie-v-dgi-moskvy">Заявление в ДГИ</Link>
            <Link href="/zhaloba-na-dgi-moskvy">Обжалование</Link>
            <Link href="/o-proekte">О проекте и источниках</Link>
            {previewOnlyLinks.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
            <a href="mailto:admin@dgi-pravo.ru">Редакция: admin@dgi-pravo.ru</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
