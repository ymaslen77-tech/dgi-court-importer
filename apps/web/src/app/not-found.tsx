import Link from 'next/link';
import { Header, Footer } from '../components/site-chrome';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="container section pending">
        <p className="eyebrow red">404</p>
        <h1>Страница не найдена</h1>
        <p>Проверьте адрес либо вернитесь в каталог жилищных вопросов.</p>
        <Link className="primary-button" href="/">Вернуться на главную →</Link>
      </main>
      <Footer />
    </>
  );
}
