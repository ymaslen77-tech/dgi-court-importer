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

/* Hide only verified editorial boilerplate — never substantive legal content. */
function isRepeatedNotice(block: MigratedBlock): boolean {
  return block.kind === "p" &&
    /^(Это собственное изложение основных положений|Сведения носят справочный характер\.|Материалы приведены непосредственно на странице\.|Публикация на mos\.ru подтверждает происхождение источника|ПОИСКОВЫЕ ВОПРОСЫ И ПРАКТИЧЕСКИЕ МАРШРУТЫ$|НОВЫЕ ПРАКТИЧЕСКИЕ РУКОВОДСТВА$)/iu.test(block.text.trim());
}

function ContentBlock({ block, slug }: { block: MigratedBlock; slug: string }) {
  const anchor = legacyAnchors.find(entry => entry.slug === slug && entry.heading === block.text)?.id;
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
      // Reclassify label-like imported paragraphs visually, without removing their text.
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
  const result: ReactNode[] = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (block.kind === "h3" || block.kind === "h4") {
      let end = i + 1;
      while (end < blocks.length && !["h1", "h2", "h3", "h4"].includes(blocks[end].kind)) end++;
      const section = blocks.slice(i + 1, end);
      const next = blocks[end];
      if (!section.length && (!next || next.kind === "h2" || next.kind === "h1" ||
        (block.kind !== "h3" && next.kind !== "h4"))) continue;
      // Only short questions are collapsible. Requirements, deadlines, sources
      // and procedural explanations remain expanded and directly readable.
      if (isQuestion(block.text) && section.some(entry => entry.kind === "p")) {
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

type Section = { heading: string; id: string; steps: boolean; blocks: MigratedBlock[] };
function groupSections(blocks: MigratedBlock[], slug: string): { intro: MigratedBlock[]; sections: Section[] } {
  const intro: MigratedBlock[] = [];
  const sections: Section[] = [];
  let current: Section | undefined;
  for (const block of blocks) {
    if (block.kind === "h2") {
      const legacy = legacyAnchors.find(entry => entry.slug === slug && entry.heading === block.text)?.id;
      current = {
        heading: block.text,
        id: legacy || "razdel-" + (sections.length + 1),
        steps: /(пошагов|шаг[ио]|действи[йя]|порядок действи|порядок оформлени|порядок проверки)/iu.test(block.text),
        blocks: [],
      };
      sections.push(current);
    } else if (current) current.blocks.push(block);
    else intro.push(block);
  }
  // Imported Webflow snapshots contain empty promotional headings, sometimes
  // followed immediately by another h2. They must not appear as fake sections
  // or clickable items. Require real explanatory text or a valid source link.
  // Nested h3/h4 alone do not count as a usable answer.
  const populated = sections.filter(section =>
    section.blocks.some(block =>
      (block.kind === "p" && block.text.trim().length > 0) ||
      (block.kind === "link" && Boolean(safeHref(block.href)))
    )
  );
  return { intro, sections: populated };
}

export function MigratedArticle({ page, home = false, afterHero }: {
  page: MigratedPage; home?: boolean; afterHero?: ReactNode;
}) {
  const titleIndex = page.blocks.findIndex(block => block.kind === "h1");
  const introIndex = page.blocks.findIndex((block, index) =>
    index > titleIndex && block.kind === "p" && block.text.length > 50 && !isRepeatedNotice(block));
  const title = titleIndex >= 0 ? page.blocks[titleIndex].text : page.title;
  const lead = introIndex >= 0 ? page.blocks[introIndex].text : page.description;
  const body = page.blocks.filter((block, i) =>
    i !== titleIndex && i !== introIndex && !isRepeatedNotice(block));
  const { intro, sections } = groupSections(body, page.slug);
  const navigable = sections.filter(section => section.blocks.some(b => b.kind === "p" || b.kind === "h3" || b.kind === "link"));
  return <>
    <SeoMarkup page={page} />
    <section className="hero hero--thematic">
      <div className="container">
        {!home && <nav className="breadcrumb" aria-label="Навигационная цепочка">
          <Link href="/">Главная</Link><span aria-hidden="true">/</span>
          <span aria-current="page">{page.title}</span>
        </nav>}
        <h1>{title}</h1>
        {lead && <p className="hero-lead">{lead}</p>}
      </div>
    </section>
    {afterHero}
    <section className="article-section" id="material">
      <div className="container content-layout">
        <article className="article">
          {navigable.length >= 3 && <nav className="article-contents" aria-label="Содержание страницы">
            <h2>На этой странице</h2>
            <ol>{navigable.map(section =>
              <li key={section.id}><a href={"#" + section.id}>{section.heading}</a></li>)}</ol>
          </nav>}
          {!!intro.length && <div className="article-introduction">
            <ArticleReadingFlow blocks={intro} slug={page.slug} />
          </div>}
          {sections.map(section => <section className={"article-topic" + (section.steps ? " article-topic--steps" : "")}
            aria-labelledby={section.id} key={section.id}>
            <h2 className="article-h2" id={section.id}>{section.heading}</h2>
            <ArticleReadingFlow blocks={section.blocks} slug={page.slug} />
          </section>)}
          {!siteIsLive && page.slug === "normativnye-akty" &&
            <p className="article-action"><Link href="/spravochnik-zhilishchnogo-zakonodatelstva-moskvy">Справочник жилищных законов и постановлений →</Link></p>}
          {!siteIsLive && hasHousingSupplement(page.slug) &&
            <details className="article-faq legal-steps">
              <summary><span>Подробный порядок действий и документы</span><span className="faq-indicator" aria-hidden="true">+</span></summary>
              <HousingSupplement page={page} />
            </details>}
        </article>
        <aside className="article-aside">
          <nav className="aside-panel" aria-label="Дополнительные материалы">
            <span className="aside-label">Действия и документы</span>
            <Link href="/zayavlenie-v-dgi-moskvy">Заявление в ДГИ</Link>
            <Link href="/zhaloba-na-dgi-moskvy">Обжалование решения</Link>
            <Link href="/sudebnaya-praktika-dgi">Судебная практика</Link>
            <Link href="/normativnye-akty">Нормативные акты</Link>
          </nav>
        </aside>
      </div>
    </section>
  </>;
}
