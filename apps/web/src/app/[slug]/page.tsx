import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CourtList } from '@/components/court-list';
import { SourceContent } from '@/components/source-content';
import { getPage, getPageHeading, getPages } from '@/lib/webflow';
import { canonicalUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return getPages().filter((page) => page.slug).map((page) => ({ slug: page.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params, page = getPage(slug);
  if (!page) return {};
  return {
    title: page.seo.title || page.title,
    description: page.seo.description || undefined,
    alternates: { canonical: canonicalUrl('/' + slug) },
    openGraph: {
      title: page.seo.title || page.title,
      description: page.seo.description || undefined,
      type: 'article',
      locale: 'ru_RU',
    },
  };
}
export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const page = getPage(slug);
  if (!page) notFound();
  return <>
    <section className="hero topic-hero">
      <div className="container">
        <nav className="breadcrumbs" aria-label="Хлебные крошки">
          <Link href="/">Главная</Link><span aria-hidden="true">/</span><span>{page.title}</span>
        </nav>
        <p className="eyebrow">ЖИЛИЩНОЕ ПРАВО / СПРАВОЧНЫЙ РАЗДЕЛ</p>
        <h1>{getPageHeading(page)}</h1>
        <p className="hero-copy">{page.blocks.find((block) => block.type === 'p')?.text || page.seo.description}</p>
      </div>
    </section>
    <div className="container topic-layout">
      <SourceContent page={page} />
      {slug === 'sudebnaya-praktika-dgi' && <CourtList />}
      <section className="further-cta"><p className="eyebrow">ПОХОЖИЕ ВОПРОСЫ</p>
        <h2>Нужна другая инструкция?</h2>
        <Link href="/">Вернуться к каталогу разделов <span aria-hidden="true">→</span></Link>
      </section>
    </div>
  </>;
}
