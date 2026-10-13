import Link from 'next/link';

export default function NotFound() {
  return <section className="container error-page">
    <p className="eyebrow">404 · СТРАНИЦА НЕ НАЙДЕНА</p>
    <h1>Такого раздела нет</h1>
    <p>Проверьте адрес или откройте каталог юридических тем.</p>
    <Link className="button-primary" href="/">На главную →</Link>
  </section>;
}
