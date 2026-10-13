import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { legacyPages } from '@/lib/legacy-pages'
import { defaultRobots, legacyHref } from '@/lib/site'
import { getVerifiedPage } from '@/lib/resolve-page'
type Props = { params: Promise<{ slug: string }> }
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const entry = legacyPages.find(p => p.slug === slug && !p.isInternal)
  if (!entry) return { robots: { index: false, follow: false } }
  const verified = await getVerifiedPage(slug)
  return { title: verified?.seoTitle || entry.seoTitle || entry.title,
    description: verified?.seoDescription || entry.seoDescription || undefined,
    robots: verified ? defaultRobots : { index: false, follow: false },
  }
}
export default async function TopicPage({ params }: Props) {
  const { slug } = await params
  const entry = legacyPages.find(p => p.slug === slug && !p.isInternal)
  if (!entry) notFound()
  const verified = await getVerifiedPage(slug)
  const title = verified?.title || entry.title
  return <main><div className="shell"><div className="breadcrumbs"><Link href="/">Главная</Link> / {title}</div></div>
    <section className="hero"><div className="shell"><div className="overline">ЖИЛИЩНЫЕ ВОПРОСЫ МОСКВЫ</div><h1>{title}</h1><p>{entry.seoDescription}</p></div></section>
    <section className="section"><div className="shell">
      {verified?.bodyText ? <article className="article-body">{verified.bodyText}</article> : <>
        <div className="preview-flag"><strong>Материал переносится.</strong> Заголовок и SEO-описание получены из Webflow. Полный юридический текст пока не перенесён и не проверен; эта страница не индексируется.</div>
        <p className="section-lead">До завершения проверки используйте действующую страницу с документами и источниками.</p>
        <a className="btn" href={legacyHref(slug)} target="_blank" rel="noopener noreferrer">ОТКРЫТЬ ОРИГИНАЛ В WEBFLOW ↗</a>
      </>}
    </div></section></main>
}
