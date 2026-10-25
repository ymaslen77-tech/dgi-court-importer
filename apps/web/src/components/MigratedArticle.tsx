import Link from "next/link";
import type { ReactNode } from "react";
import type { MigratedBlock, MigratedPage } from "@/data/pages";
import legacyAnchors from "@/data/legacy-anchors.json";
import { SeoMarkup } from "./SeoMarkup";
import { HousingSupplement, hasHousingSupplement } from "./HousingGuide";
import { siteIsLive } from "@/data/pages";

function safeHref(href?: string) {
  if (!href) return undefined;
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  if (href.startsWith("https://")) return href;
  return undefined;
}

/* Editorial notices and layout instructions belong in the footer, not inside
   the legal explanation. Never suppress a substantive legal warning. */
function isRepeatedNotice(block: MigratedBlock): boolean {
  if (block.kind !== "p") return false;
  return /^(Это собственное изложение основных положений|Сведения носят справочный характер\.|Материалы приведены непосредственно на странице\.|Публикация на mos\.ru подтверждает происхождение источника|ПОИСКОВЫЕ ВОПРОСЫ И ПРАКТИЧЕСКИЕ МАРШРУТЫ$|НОВЫЕ ПРАКТИЧЕСКИЕ РУКОВОДСТВА$)/iu.test(block.text.trim());
}

function ContentBlock({ block, slug }: { block: MigratedBlock; slug: string }) {
  const anchor = legacyAnchors.find((entry) =>
    entry.slug === slug && entry.heading === block.text
  )?.id;
  switch (block.kind) {
    case "h1":
    case "h2": return <h2 className="article-h2" id={anchor}>{block.text}</h2>;
    case "h3": return <h3 className="article-h3" id={anchor}>{block.text}</h3>;
    case "h4": return <h4 className="article-h4" id={anchor}>{block.text}</h4>;
    case "link": {
      const href = safeHref(block.href);
      if (!href) return null;
      const label = block.text.replace(/\s*[↗→]\s*$/u, "").trim();
      return <p className="article-action">{href.startsWith("https://")
        ? <a href={href} target="_blank" rel="noopener noreferrer">{label} ↗</a>
        : <Link href={href}>{label} →</Link>}</p>;
    }
    default:
      if (/^(ЧЕК-ЛИСТ ДОКУМЕНТОВ|ЧАСТЫЙ ВОПРОС|ПРАВОВАЯ ОСНОВА(?: И ПЕРВОИСТОЧНИКИ)?|НОРМАТИВНАЯ БАЗА)$/iu.test(block.text.trim())) {
        return <h3 className="article-h3 article-h3--label">{block.text}</h3>;
      }
      return <p className="article-p">{block.text}</p>;
  }
}

const isQuestion = (text: string) =>
  /[?？]\s*$/.test(text) ||
  /^(как|что|где|когда|почему|кто|какие|можно ли|нужно ли)\s/iu.test(text);

function ArticleReadingFlow({ blocks, slug }: { blocks: MigratedBlock[]; slug: string }) {
  const content = blocks.filter((block) => !isRepeatedNotice(block));
  const result: ReactNode[] = [];

  for (let i = 0; i < content.length; i++) {
    const block = content[i];
    if (block.kind === "h2" || block.kind === "h3" || block.kind === "h4") {
      let end = i + 1;
      while (end < content.length && !["h1", "h2", "h3", "h4"].includes(content[end].kind)) end++;
      const section = content.slice(i + 1, end);
      const next = content[end];
      // The migration contained empty headings. Do not publish empty
      // sections, unexplained promises or placeholder destination cards.
      if (!section.length && (!next || next.kind === "h2" || next.kind === "h1" ||
          (block.kind !== "h2" && next.kind !== "h4"))) continue;

      // Short answers are optional to expand, while ordinary legal guidance
      // and procedural steps remain directly readable without clicking.
      if (isQuestion(block.text) && section.some((entry) => entry.kind === "p")) {
        result.push(<details className="article-faq" key={i}>
          <summary><span>{block.text}</span><span className="faq-indicator" aria-hidden="true">+</span></summary>
          <div className="article-faq-answer">
            {section.map((item, j) => <ContentBlock key={j} block={item} slug={slug} />)}
          </div>
        </details>);
        i = end - 1;
        continue;
      }
    }
    result.push(<ContentBlock block={block} slug={slug} key={i} />);
  }
  return <>{result}</>;
}

export function MigratedArticle({ page, home = false, afterHero }: {
  page: MigratedPage; home?: boolean; afterHero?: ReactNode;
}) {
  const titleIndex = page.blocks.findIndex((block) => block.kind === "h1");
  const introIndex = page.blocks.findIndex((block, index) =>
    index > titleIndex && block.kind === "p" && block.text.length > 50 && !isRepeatedNotice(block)
  );
  const title = titleIndex >= 0 ? page.blocks[titleIndex].text : page.title;
  const lead = introIndex >= 0 ? page.blocks[introIndex].text : page.description;
  const body = page.blocks.filter((block, i) =>
    i !== titleIndex && i !== introIndex && !isRepeatedNotice(block)
  );

  return <>
    <SeoMarkup page={page} />
    <section className="hero hero--thematic">
      <div className="container">
        {!home && <nav className="breadcrumb" aria-label="Навигационная цепочка">
          <Link href="/">Главная</Link><span aria-hidden="true">/</span><span aria-current="page">{page.title}</span>
        </nav>}
        <h1>{title}</h1>
        {lead && <p className="hero-lead">{lead}</p>}
      </div>
    </section>
    {afterHero}
    <section className="article-section" id="material">
      <div className="container content-layout">
        <article className="article">
          <ArticleReadingFlow blocks={body} slug={page.slug} />
          {!siteIsLive && page.slug === "normativnye-akty" && <p className="article-action"><Link href="/spravochnik-zhilishchnogo-zakonodatelstva-moskvy">Справочник жилищных законов и постановлений →</Link></p>}
          {!siteIsLive && hasHousingSupplement(page.slug) && <details className="article-faq legal-steps"><summary><span>Подробный порядок действий и документы</span><span className="faq-indicator" aria-hidden="true">+</span></summary><HousingSupplement page={page} /></details>}
        </article>
        <aside className="article-aside">
          <nav className="aside-panel" aria-label="По теме">
            <span className="aside-label">По теме</span>
            <Link href="/zayavlenie-v-dgi-moskvy">Подать заявление</Link>
            <Link href="/zhaloba-na-dgi-moskvy">Обжаловать решение</Link>
            <Link href="/sudebnaya-praktika-dgi">Судебные дела</Link>
            <Link href="/normativnye-akty">Правовые документы</Link>
          </nav>
        </aside>
      </div>
    </section>
  </>;
}
