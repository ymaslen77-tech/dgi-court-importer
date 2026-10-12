import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, migratedPages } from "@/lib/pages";
import { robotsRule } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };
export function generateStaticParams() {
  return migratedPages().map((page) => ({ slug: page.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) return { title: "Материал недоступен", robots: { index: false } };
  return {
    title: page.title, description: page.description, robots: robotsRule,
    alternates: { canonical: "/" + slug },
  };
}
export default async function MigratedPage({ params }: Props) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  const h1 = page.blocks.find((block) => block.kind === "h1")?.text || page.title;
  let firstH1Rendered = false;
  return <main>
    <section className="inner-hero"><div className="wrap">
      <p className="eyebrow">ЖИЛИЩНОЕ ПРАВО / МОСКВА</p>
      <h1>{h1}</h1><p>{page.description}</p>
    </div></section>
    <section className="section"><article className="wrap migrated-article">
      {page.blocks.map((block, i) => {
        if (block.kind === "h1") {
          if (firstH1Rendered) return null;
          firstH1Rendered = true;
          return null;
        }
        if (block.kind === "h2") return <h2 key={i}>{block.text}</h2>;
        if (block.kind === "h3") return <h3 key={i}>{block.text}</h3>;
        if (block.kind === "li") return <p className="list-entry" key={i}>• {block.text}</p>;
        if (block.kind === "link" && block.href) {
          const href = block.href;
          const external = href.startsWith("https://");
          return <p className="source-entry" key={i}>
            <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{block.text} ↗</Link>
          </p>;
        }
        return <p key={i}>{block.text}</p>;
      })}
      <p className="editorial-note">Материал перенесён с действующего сайта. Перед использованием сведений в конкретном деле проверяйте актуальные нормы и первичные документы.</p>
      <p><Link href="/" className="back-link">← КО ВСЕМ РАЗДЕЛАМ</Link></p>
    </article></section>
  </main>;
}
