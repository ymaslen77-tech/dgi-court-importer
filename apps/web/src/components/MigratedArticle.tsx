import Link from "next/link";
import type { ReactNode } from "react";
import type { MigratedBlock, MigratedPage } from "@/data/pages";
import legacyAnchors from "@/data/legacy-anchors.json";
import { SeoMarkup } from "./SeoMarkup";
import { isThematicSlug } from "@/data/themes";

const sanitizeHref = (href?: string) => {
  if (!href) return undefined;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("https://")) return href;
  return undefined;
};

function ContentBlock({ block, pageSlug }: { block: MigratedBlock; pageSlug: string }) {
  // Preserve deep links from the original Webflow landing pages.
  const anchor = legacyAnchors.find((item) =>
    item.slug === pageSlug && item.heading === block.text
  )?.id;
  if (block.kind === "h1" || block.kind === "h2") return <h2 id={anchor} className="article-h2">{block.text}</h2>;
  if (block.kind === "h3") return <h3 id={anchor} className="article-h3">{block.text}</h3>;
  if (block.kind === "h4") return <h4 id={anchor} className="article-h4">{block.text}</h4>;
  if (block.kind === "link") {
    const href = sanitizeHref(block.href);
    if (!href) return null;
    return href.startsWith("https://")
      ? <p className="article-action"><a href={href} target="_blank" rel="noopener noreferrer">{block.text} ↗</a></p>
      : <p className="article-action"><Link href={href}>{block.text} →</Link></p>;
  }
  return <p className="article-p">{block.text}</p>;
}

export function MigratedArticle({ page, home = false, afterHero }: { page: MigratedPage; home?: boolean; afterHero?: ReactNode }) {
  const thematic = isThematicSlug(page.slug) && !home;
  const headingIndex = page.blocks.findIndex((block) => block.kind === "h1");
  const introIndex = page.blocks.findIndex((block, index) =>
    index > headingIndex && block.kind === "p" && block.text.length > 50,
  );
  const heading = headingIndex >= 0 ? page.blocks[headingIndex].text : page.title;
  const lead = introIndex >= 0 ? page.blocks[introIndex].text : page.description;
  const body = page.blocks.filter((_block, index) => index !== headingIndex && index !== introIndex);

  return (
    <>
      <SeoMarkup page={page} />
      <section className={thematic ? "hero hero--thematic" : "hero"}>
        <div className="container">
          {!home && <nav className="breadcrumb" aria-label="Навигационная цепочка">
            <Link href="/">Главная</Link><span aria-hidden="true"> / </span><span aria-current="page">{page.title}</span>
          </nav>}
          <div className="hero-eyebrow">{home ? "НЕЗАВИСИМАЯ СПРАВОЧНО-ПРАВОВАЯ ПОМОЩЬ · МОСКВА" : thematic ? "ТЕМАТИЧЕСКИЙ РАЗДЕЛ" : "ЖИЛИЩНЫЕ ВОПРОСЫ / МОСКВА"}</div>
          <h1>{heading}</h1>
          {lead && <p className="hero-lead">{lead}</p>}
          {thematic ? <p className="editorial-notice">
            Статус информации. Это собственное изложение основных положений официальных материалов, а не копия действующего административного регламента. Перед юридическим использованием проверьте актуальную редакцию документа на mos.ru.
          </p> : <a className="hero-link" href={home ? "#services" : "#material"}>
            {home ? "ВЫБРАТЬ НАПРАВЛЕНИЕ ↓" : "ПЕРЕЙТИ К МАТЕРИАЛАМ ↓"}
          </a>}
        </div>
      </section>
      {afterHero}
      <section className="article-section" id="material">
        <div className="container content-layout">
          <article className="article">
            {body.map((block, i) => <ContentBlock key={`${i}-${block.kind}`} block={block} pageSlug={page.slug} />)}
          </article>
          <aside className="article-aside">
            <div className="aside-panel">
              <span className="aside-label">ПОЛЕЗНЫЕ РАЗДЕЛЫ</span>
              <Link href="/sudebnaya-praktika-dgi">Поиск судебных дел →</Link>
              <Link href="/zhaloba-na-dgi-moskvy">Жалоба на ДГИ →</Link>
              <Link href="/zayavlenie-v-dgi-moskvy">Заявление в ДГИ →</Link>
              <Link href="/normativnye-akty">Нормативные документы →</Link>
            </div>
            <p className="aside-note">Текст перенесён из опубликованной версии Webflow. Требуется проверка верстки, изображений и актуальности правовых сведений до переключения домена.</p>
          </aside>
        </div>
      </section>
    </>
  );
}
