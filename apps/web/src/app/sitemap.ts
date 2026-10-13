import type { MetadataRoute } from "next";
import { migratedPages, siteIsLive, siteOrigin } from "@/data/pages";
import { listPublishedEditorialSlugs } from "@/data/published";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Never expose CMS slugs on staging; the site cutover gate remains mandatory.
  if (!siteIsLive) return [];
  const slugs = new Set(migratedPages.map(p => p.slug));
  for (const slug of await listPublishedEditorialSlugs()) slugs.add(slug);
  return [...slugs].sort().map(slug => ({
    url: new URL(slug ? `/${slug}` : "/", siteOrigin).toString(),
    changeFrequency: slug === "sudebnaya-praktika-dgi" ? "weekly" : "monthly",
    priority: slug === "" ? 1 : 0.7,
  }));
}
