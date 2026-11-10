import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";
import { siteIsLive } from "@/data/pages";
import { getNavigatorPreviewGroups } from "@/data/navigator-preview";

// Private prototype, never a newly indexable or published legal page.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute:"Навигатор жилищных тем — закрытый прототип" },
  description:"Навигационный прототип на основе уже опубликованных разделов справочника.",
  robots: { index: false, follow: false },
};

export default function NavigatorPreviewPage() {
  if (siteIsLive) notFound();
  const groups=getNavigatorPreviewGroups();
  return <PageShell variant="thematic">
    <section className="hero hero--thematic"><div className="container">
      <nav className="breadcrumb" aria-label="Навигационная цепочка">
        <Link href="/">Главная</Link><span>/</span><span aria-current="page">Навигатор тем</span>
      </nav>
      <h1>Навигатор жилищных тем</h1>
      <p className="hero-lead">Выберите тему, чтобы перейти к существующим материалам справочника.</p>
    </div></section>
    <section className="container navigator-preview" aria-label="Темы жилищного справочника">
      <p className="navigator-preview-note">Это закрытый прототип навигации, а не инструмент определения прав, сроков или выбора способа защиты. Новые юридические рекомендации здесь не публикуются.</p>
      <div className="navigator-preview-grid">
        {groups.map(group=><details key={group.id} className="navigator-preview-group">
          <summary>{group.title}</summary>
          <ul>{group.items.map(item=><li key={item.href}>
            <Link href={item.href}>{item.title}</Link>
          </li>)}</ul>
        </details>)}
      </div>
      <p className="navigator-preview-note">Содержание существующих страниц требует самостоятельной проверки актуальности. Наличие ссылки не означает юридического подтверждения её текста.</p>
    </section>
  </PageShell>;
}
