import Link from "next/link";
import { PageShell } from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell>
      <div className="container not-found">
        <p className="section-eyebrow">404 / СТРАНИЦА НЕ НАЙДЕНА</p>
        <h1>Такого раздела пока нет</h1>
        <p>Вернитесь к жилищным темам или воспользуйтесь навигацией.</p>
        <Link href="/" className="solid-button">НА ГЛАВНУЮ →</Link>
      </div>
    </PageShell>
  );
}
