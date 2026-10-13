import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { publicCourtBySlug, publicCourts } from '@/lib/courts';
import { canonicalUrl } from '@/lib/site';

type Props = { params: Promise<{ slug: string }> };
export const dynamicParams = false;
export function generateStaticParams() {
  return publicCourts().map((c) => ({ slug: c.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params, record = publicCourtBySlug(slug);
  if (!record) return {};
  return {
    title: { absolute: record.title },
    description: 'Сведения о судебном деле ' + (record.number || record.title) +
      '. Первичный акт и история пересмотра требуют отдельной проверки.',
    alternates: { canonical: canonicalUrl('/dgi-court-cases/' + slug) },
    // Never index an unverified individual judicial item.
    robots: { index: false, follow: false },
  };
}
export default async function CourtDetails({ params }: Props) {
  const { slug } = await params, record = publicCourtBySlug(slug);
  if (!record) notFound();
  return <>
    <section className="hero topic-hero"><div className="container">
      <p className="eyebrow">СУДЕБНАЯ ПРАКТИКА / АРХИВ</p>
      <h1>{record.title}</h1>
      <p className="hero-copy">{record.number || 'Номер дела уточняется'} · {record.court}</p>
    </div></section>
    <div className="container narrow-content">
      <div className="verification-banner"><strong>Статус проверки</strong>
        <p>Это перенесённая карточка. Текст акта и история обжалования пока
          не подтверждены официальным первоисточником. Не используйте её как доказательство
          судебного результата или действующей правовой позиции.</p>
      </div>
      <dl className="case-facts">
        <dt>Номер дела</dt><dd>{record.number || 'Не указан'}</dd>
        <dt>Суд</dt><dd>{record.court || 'Требует уточнения'}</dd>
        <dt>Категория</dt><dd>{record.topic || 'Требует классификации'}</dd>
      </dl>
      {record.source && <a className="button-primary" href={record.source}
        target="_blank" rel="noopener noreferrer">Официальная карточка дела ↗</a>}
      <p className="back-link"><Link href="/sudebnaya-praktika-dgi">← Вернуться к судебной практике</Link></p>
    </div>
  </>;
}
