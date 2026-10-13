import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MigratedArticle } from "@/components/MigratedArticle";
import { PageShell } from "@/components/PageShell";
import { canonicalUrl, getMigratedPage, migratedPages, siteIsLive } from "@/data/pages";
import { getPublishedEditorialPage } from "@/data/published";

type Props = { params: Promise<{ slug: string }> };

// DB publication must be evaluated at request time (never pre-render approved drafts).
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return migratedPages.filter((p) => p.slug && p.slug !== "sudebnaya-praktika-dgi").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = (await getPublishedEditorialPage(slug)) ?? getMigratedPage(slug);
  if (!page || slug === "sudebnaya-praktika-dgi") return {};
  return {
    title: { absolute: page.seoTitle },
    description: page.description,
    alternates: { canonical: canonicalUrl(page) },
    robots: siteIsLive ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  if (slug === "sudebnaya-praktika-dgi") notFound();
  // Render the same approved editorial revision used for metadata and sitemap.
  const page = (await getPublishedEditorialPage(slug)) ?? getMigratedPage(slug);
  if (!page) notFound();
  return (
    <PageShell>
      <MigratedArticle page={page} />
    </PageShell>
  );
}
