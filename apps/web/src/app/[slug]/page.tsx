import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { guides } from '../../lib/editorial';
import { findRoute, routes, sourceUrl } from '../../lib/routes';
import { INDEXABLE } from '../../lib/site';
import { Guide } from '../../components/guide';
import { Footer, Header } from '../../components/site-chrome';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return routes.filter((p) => p.slug !== 'sudebnaya-praktika-dgi')
    .map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = findRoute(slug);
  if (!entry) return { robots: { index: false, follow: false } };
  const ready = Boolean(guides[slug]);
  return {
    title: entry.title,
    description: entry.description,
    alternates: ready ? { canonical: '/' + slug } : undefined,
    robots: { index: ready && INDEXABLE, follow: INDEXABLE },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const entry = findRoute(slug);
  if (!entry) notFound();

  const guide = guides[slug];
  if (guide) {
    return <Guide guide={guide} source={sourceUrl(slug)} />;
  }

  // The source Webflow site stays online. Do not fabricate partial legal text
  // or expose thin SEO pages before a reviewed content migration.
  return (
    <>
      <Header />
      <main className="section container pending">
        <p className="eyebrow red">МИГРАЦИЯ САЙТА · НЕОПУБЛИКОВАННЫЙ РАЗДЕЛ</p>
        <h1>{entry.title}</h1>
        <p>Полный материал пока доступен на действующем сайте. Эта версия страницы не предназначена для поисковой индексации.</p>
        <a className="primary-button" href={sourceUrl(slug)}>Открыть полный материал на Webflow ↗</a>
      </main>
      <Footer />
    </>
  );
}
