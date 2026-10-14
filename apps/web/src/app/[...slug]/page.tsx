import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MigratedArticle } from "@/components/MigratedArticle";
import { PageShell } from "@/components/PageShell";
import { canonicalUrl, getMigratedPage, migratedPages, siteIsLive } from "@/data/pages";
import { getPublishedEditorialPage } from "@/data/published";
import { isThematicSlug } from "@/data/themes";

type Props = { params: Promise<{ slug: string[] }> };

function resolvedSlug(parts: string[]): string | undefined {
  if (!Array.isArray(parts) || parts.length < 1 || parts.length > 2 ||
      !parts.every(part => /^[a-z0-9-]+$/.test(part))) return undefined;
  return parts.join("/");
}

// DB publication must be evaluated at request time (never pre-render approved drafts).
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return migratedPages.filter((p) => p.slug && p.slug !== "sudebnaya-praktika-dgi").map((p) => ({ slug: [p.slug] }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: parts } = await params;
  const slug = resolvedSlug(parts);
  if (!slug || slug === "sudebnaya-praktika-dgi") return {};
  const page = (await getPublishedEditorialPage(slug)) ?? getMigratedPage(slug);
  if (!page) return {};
  return {
    title: { absolute: page.seoTitle },
    description: page.description,
    alternates: { canonical: canonicalUrl(page) },
    robots: siteIsLive ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug: parts } = await params;
  const slug = resolvedSlug(parts);
  if (!slug || slug === "sudebnaya-praktika-dgi") notFound();
  // Render the same approved editorial revision used for metadata and sitemap.
  const page = (await getPublishedEditorialPage(slug)) ?? getMigratedPage(slug);
  if (!page) notFound();
  return (
    <PageShell variant={isThematicSlug(slug) ? "thematic" : "default"}>
      <MigratedArticle page={page} />
    </PageShell>
  );
}
