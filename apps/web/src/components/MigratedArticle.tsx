import Link from "next/link";
import type { ReactNode } from "react";
import type { MigratedBlock, MigratedPage } from "@/data/pages";
import legacyAnchors from "@/data/legacy-anchors.json";
import { SeoMarkup } from "./SeoMarkup";
import { isThematicSlug, sourceHeadingAccentIndex } from "@/data/themes";
import { getMigratedPage } from "@/data/pages";
import missingTopics from "@/data/missing-topic-destinations.json";
import { HousingSupplement } from "./HousingGuide";
import { siteIsLive } from "@/data/pages";

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


const topicDestinations = missingTopics as Record<string, Record<string, string>>;
const needsAnswer = (text: string): boolean =>
  /[?？]\s*$/.test(text) ||
  /^(?:как|что|где|куда|когда|почему|зачем|кто|кому|какие|какой|можно ли|нужно ли)(?:\s|$)/iu.test(text);

function SourceHeadingId(block: MigratedBlock, slug: string) {
  return legacyAnchors.find(item => item.slug === slug && item.heading === block.text)?.id;
}

function TopicDestination({ slug, title }: { slug: string; title: string }) {
  const href = topicDestinations[slug]?.[title];
  // CMS editors can add new drafts; never throw on an unreviewed CMS heading.
  // Migrated snapshot headings MUST all have explicit destinations (tested).
  if (!href) return <p className="article-topic-note">
    Подробное содержание этого раздела пока не подтверждено.
    <Link href="/gosuslugi-dgi">Перейти к справочнику государственных услуг →</Link>
  </p>;
  const internal = href.startsWith("/");
  const target = internal ? getMigratedPage(href.slice(1)) : undefined;
  return <div className="article-related-topic">
    <p>{internal ? "Подробнее в связанном материале:" : "Первичный официальный ресурс для уточнения сведений:"}</p>
    {target?.description && <p className="article-related-summary">{target.description}</p>}
    {internal
      ? <Link href={href}>{target?.title ?? "Читать тематическое руководство"} <span aria-hidden="true">→</span></Link>
      : <a href={href} target="_blank" rel="noopener noreferrer">
          Открыть официальный источник <span aria-hidden="true">↗</span>
        </a>}
  </div>;
}

/**
 * Source blocks are flat. A section with content becomes a native HTML
 * disclosure when it is a question or a subtopic. Empty source H2 headings
 * get an explicitly reviewed destination instead of a fake legal answer.
 */
function ArticleReadingFlow({ blocks, slug }: { blocks: MigratedBlock[]; slug: string }) {
  const result: ReactNode[] = [];
  for (let i = 0; i < blocks.length;) {
    const block = blocks[i];
    const level = block.kind;
    const isHeading = level === "h2" || level === "h3" || level === "h4";
    if (!isHeading) {
      result.push(<ContentBlock key={`body-${i}`} block={block} pageSlug={slug} />);
      i++;
      continue;
    }

    let end = i + 1;
    while (end < blocks.length && !["h1","h2","h3","h4"].includes(blocks[end].kind)) end++;
    const content = blocks.slice(i + 1, end);
    const collapsible = content.some(entry => entry.kind === "p") &&
      (level === "h3" || needsAnswer(block.text));
    if (collapsible) {
      const headingClass = level === "h2" ? "article-h2" : level === "h4" ? "article-h4" : "article-h3";
      const Heading = level;
      result.push(
        <details className="article-faq" key={`faq-${i}`} id={SourceHeadingId(block,slug)}>
          <summary>
            <Heading className={headingClass}>{block.text}</Heading>
            <span className="faq-indicator" aria-hidden="true">+</span>
          </summary>
          <div className="article-faq-answer">
            {content.map((entry, index) =>
              <ContentBlock key={`answer-${i}-${index}`} block={entry} pageSlug={slug} />
            )}
          </div>
        </details>,
      );
      i = end;
      continue;
    }

    result.push(<ContentBlock key={`heading-${i}`} block={block} pageSlug={slug} />);
    // Adjacent peer headings or the end of the page previously left empty
    // promises. Never infer an answer from unrelated legal text.
    if (level === "h2" && content.length === 0 && (end === blocks.length || blocks[end].kind === "h2")) {
      result.push(<TopicDestination key={`destination-${i}`} slug={slug} title={block.text} />);
    }
    i++;
  }
  return <>{result}</>;
}

export function MigratedArticle({ page, home = false, afterHero }: { page: MigratedPage; home?: boolean; afterHero?: ReactNode }) {
  const thematic = isThematicSlug(page.slug) && !home;
  const headingIndex = page.blocks.findIndex((block) => block.kind === "h1");
  const introIndex = page.blocks.findIndex((block, index) =>
    index > headingIndex && block.kind === "p" && block.text.length > 50,
  );
  const heading = headingIndex >= 0 ? page.blocks[headingIndex].text : page.title;
  const lead = introIndex >= 0 ? page.blocks[introIndex].text : page.description;
  const sourceBody = page.blocks.filter((_block, index) => index !== headingIndex && index !== introIndex);
  // Reuse the source disclaimer once; avoid displaying it a second time in
  // the article after the light hero. Never rewrite the legal content itself.
  const sourceNotice = thematic ? sourceBody.find(block => block.kind === "p" &&
    /^(Это собственное изложение|Сведения носят справочный характер)/.test(block.text)) : undefined;
  const body = sourceNotice ? sourceBody.filter(block => block !== sourceNotice) : sourceBody;
  // The original light pages pair their first thematic H2 with a supporting
  // paragraph/link in a dark feature card. Preserve the exact source blocks.
  const featureAt = thematic ? body.findIndex((block, index) =>
    block.kind === "h2" && body[index + 1]?.kind === "p") : -1;
  const featureLength = featureAt >= 0 ? (body[featureAt + 2]?.kind === "link" ? 3 : 2) : 0;
  const beforeFeature = featureAt >= 0 ? body.slice(0, featureAt) : [];
  const featureBlocks = featureAt >= 0 ? body.slice(featureAt, featureAt + featureLength) : [];
  const afterFeature = featureAt >= 0 ? body.slice(featureAt + featureLength) : body;
  const accentAt = home ? heading.toLocaleLowerCase("ru").lastIndexOf("по жилищным вопросам") :
    (thematic ? -1 : sourceHeadingAccentIndex(page.slug,heading));

  return (
    <>
      <SeoMarkup page={page} />
      <section className={thematic ? "hero hero--thematic" : "hero"}>
        <div className="container">
          {!home && !thematic && <nav className="breadcrumb" aria-label="Навигационная цепочка">
            <Link href="/">Главная</Link><span aria-hidden="true"> / </span><span aria-current="page">{page.title}</span>
          </nav>}
          <div className="hero-eyebrow">{home ? "НЕЗАВИСИМАЯ СПРАВОЧНО-ПРАВОВАЯ ПОМОЩЬ · МОСКВА" : thematic ? "ТЕМАТИЧЕСКИЙ РАЗДЕЛ" : "ЖИЛИЩНЫЕ ВОПРОСЫ / МОСКВА"}</div>
          <h1>{accentAt >= 0 ? <>
            {heading.slice(0, accentAt).trimEnd()}{" "}
            <span className="hero-accent">{heading.slice(accentAt)}</span>
          </> : heading}</h1>
          {lead && <p className="hero-lead">{lead}</p>}
          {thematic ? <p className="editorial-notice">
            {sourceNotice?.text ?? "Справочный материал. Перед юридическим использованием необходимо проверить официальные источники и действующую редакцию норм."}
          </p> : <div className="hero-actions">
            <a className="hero-link" href={home ? "#services" : "#material"}>
              {home ? "ВЫБРАТЬ НАПРАВЛЕНИЕ →" : "ПЕРЕЙТИ К МАТЕРИАЛАМ ↓"}
            </a>
            {home && <a className="hero-link hero-link-secondary" href="#material">КАК МЫ РАБОТАЕМ →</a>}
          </div>}
        </div>
      </section>
      {afterHero}
      <section className="article-section" id="material">
        <div className="container content-layout">
          <article className="article">
            <ArticleReadingFlow blocks={beforeFeature} slug={page.slug} />
            {featureBlocks.length > 0 && <section className="thematic-feature" aria-label="Главная тема раздела">
              <ArticleReadingFlow blocks={featureBlocks} slug={page.slug} />
            </section>}
            <ArticleReadingFlow blocks={afterFeature} slug={page.slug} />
            {!siteIsLive && <HousingSupplement page={page} />}
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
