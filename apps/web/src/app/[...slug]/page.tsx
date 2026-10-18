import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MigratedArticle } from "@/components/MigratedArticle";
import { PageShell } from "@/components/PageShell";
import { canIndexPage, canonicalUrl, getMigratedPage, migratedPages, siteIsLive } from "@/data/pages";
import { getPublishedEditorialPage } from "@/data/published";
import { isThematicSlug } from "@/data/themes";
import { findHousingGuide, HousingGuideArticle } from "@/components/HousingGuide";
import { HousingLawCatalog, housingLawCatalogSlug, housingLawCatalogTitle } from "@/components/HousingLawCatalog";
import { DgiServiceRegistry, dgiServiceRegistrySlug, dgiServiceRegistryTitle } from "@/components/DgiServiceRegistry";
import { factualSocialMetadata } from "@/data/seo-social";

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
  const page = (await getPublishedEditorialPage(slug)) ?? (!siteIsLive ? getMigratedPage(slug) : undefined);
  if (!page) {
    if (!siteIsLive && slug === dgiServiceRegistrySlug) return {
      title: { absolute: dgiServiceRegistryTitle },
      description: "Реестр официально документированных услуг ДГИ с отметкой о необходимости актуализации регламентов.",
      ...factualSocialMetadata(slug, dgiServiceRegistryTitle, "Реестр официально документированных услуг ДГИ с отметкой о необходимости актуализации регламентов."),
      robots: { index: false, follow: false },
    };
    if (!siteIsLive && slug === housingLawCatalogSlug) return {
      title: { absolute: housingLawCatalogTitle },
      description: "Перечень актов жилищного законодательства Москвы с указанием непроверенных редакций.",
      ...factualSocialMetadata(slug, housingLawCatalogTitle, "Перечень актов жилищного законодательства Москвы с указанием непроверенных редакций."),
      robots: { index: false, follow: false },
    };
    const guide = !siteIsLive && findHousingGuide(slug);
    return guide ? { title: { absolute: guide.title }, description: guide.summary, ...factualSocialMetadata(slug, guide.title, guide.summary), robots: { index: false, follow: false } } : {};
  }
  return {
    title: { absolute: page.seoTitle },
    description: page.description,
    ...factualSocialMetadata(slug, page.seoTitle, page.description),
    alternates: canIndexPage(page) ? { canonical: canonicalUrl(page) } : undefined,
    robots: canIndexPage(page) ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default async function ContentPage({ params }: Props) {
  const { slug: parts } = await params;
  const slug = resolvedSlug(parts);
  if (!slug || slug === "sudebnaya-praktika-dgi") notFound();
  // Render the same approved editorial revision used for metadata and sitemap.
  const page = (await getPublishedEditorialPage(slug)) ?? (!siteIsLive ? getMigratedPage(slug) : undefined);
  if (!page) {
    if (!siteIsLive && slug === dgiServiceRegistrySlug) {
      return <PageShell variant="thematic"><div className="container"><DgiServiceRegistry /></div></PageShell>;
    }
    if (!siteIsLive && slug === housingLawCatalogSlug) {
      return <PageShell variant="thematic"><div className="container"><HousingLawCatalog /></div></PageShell>;
    }
    const guide = !siteIsLive && findHousingGuide(slug);
    if (!guide) notFound();
    return <PageShell variant="thematic"><div className="container"><HousingGuideArticle guide={guide} /></div></PageShell>;
  }
  return (
    <PageShell variant={isThematicSlug(slug) ? "thematic" : "default"}>
      {slug === "kontakty-dgi" && (
        <section className="container editorial-email" aria-label="Контакты редакции независимого проекта">
          <h2>Почта редакции справочного проекта</h2>
          <p>По вопросам работы независимого сайта: <a href="mailto:admin@dgi-pravo.ru">admin@dgi-pravo.ru</a>.</p>
          <p className="editorial-email-note">Это не электронная почта ДГИ Москвы. Для официальных обращений используйте государственные каналы связи.</p>
        </section>
      )}
      <MigratedArticle page={page} />
    </PageShell>
  );
}
