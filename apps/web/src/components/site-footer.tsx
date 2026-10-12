import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-grid">
        <div><strong>ЕДИНАЯ СПРАВОЧНАЯ СЛУЖБА МОСКВЫ</strong><p>Справочно-правовые материалы о жилищных вопросах Москвы.</p></div>
        <div className="footer-links">
          <Link href="/normativnye-akty">Законодательство</Link>
          <Link href="/sudebnaya-praktika-dgi">Судебная практика</Link>
          <Link href="/kontakty-dgi">Контакты</Link>
        </div>
      </div>
      <div className="wrap footer-note">Материалы служат справочной информацией. Перед обращением проверяйте актуальные редакции актов и официальные документы.</div>
    </footer>
  );
}
