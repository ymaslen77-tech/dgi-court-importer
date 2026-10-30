import type { MetadataRoute } from "next";
import { siteIsLive, siteOrigin, listOwnerReleasedLegacySlugs } from "@/data/pages";
import { listPublishedEditorialSlugs } from "@/data/published";
import { listPublishedCourtActSlugs, courtActBasePath } from "@/data/court-fulltext";
import { listPublicCourtCaseSlugs } from "@/data/verified-courts";
import { housingNewsBase, listHousingNews } from "@/data/housing-news";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Never index previews; the production site must be explicitly released.
  if (!siteIsLive) return [];
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  function add(path: string, options: Omit<MetadataRoute.Sitemap[number], "url"> = {}) {
    const url = new URL(path, siteOrigin).toString();
    entries.set(url, {url, ...options});
  }

  // Existing owner-released editorial routes are indexable even before they
  // have corresponding approved CMS rows. This fixed legacy whitelist is not
  // permission to expose draft CMS records, preview legal research or archives.
  for (const slug of listOwnerReleasedLegacySlugs()) {
    if (slug === "sudebnaya-praktika-dgi" ||
        slug === housingNewsBase.slice(1)) continue; // dedicated public routes
    add(slug ? "/" + slug : "/", {
      changeFrequency: "monthly", priority: slug ? 0.7 : 1,
    });
  }

  // Only CMS entries already approved for public release; no draft inventory.
  const slugs = await listPublishedEditorialSlugs();
  for (const slug of slugs) {
    if (slug === "sudebnaya-praktika-dgi" ||
        slug === "o-proekte" ||
        slug === housingNewsBase.slice(1) ||
        slug.startsWith(housingNewsBase.slice(1) + "/") ||
        slug.startsWith("dgi-court-cases/") ||
        slug.startsWith("sudebnaya-praktika-dgi/")) continue;
    add(slug ? "/" + slug : "/", {
      changeFrequency: "monthly", priority: slug ? 0.7 : 1,
    });
  }

  // Independent public sections and source-checked new editorial articles.
  add("/o-proekte", {changeFrequency:"monthly",priority:0.4});
  add(housingNewsBase, {changeFrequency:"daily",priority:0.8});
  const news = listHousingNews();
  for (const article of news) {
    add(housingNewsBase + "/" + article.slug, {
      lastModified: new Date(article.publishedAt),
      changeFrequency:"weekly",priority:0.7,
    });
  }

  // The public court directory and all full-text HTML cases are crawlable.
  const courtCases = listPublicCourtCaseSlugs();
  if (courtCases.length) {
    add("/sudebnaya-praktika-dgi", {changeFrequency:"weekly",priority:0.8});
    for (const act of courtCases) {
      add("/sudebnaya-praktika-dgi/" + act.slug, {
        changeFrequency:"monthly",priority:0.6,
      });
    }
  }

  // Database-backed court pages remain available only when formally published.
  const databaseActs = await listPublishedCourtActSlugs();
  if (databaseActs.length) add(courtActBasePath, {
    changeFrequency:"weekly",priority:0.7,
  });
  for (const act of databaseActs) {
    add(courtActBasePath + "/" + act.slug, {
      lastModified:new Date(act.updated_at),changeFrequency:"monthly",priority:0.6,
    });
  }

  if (entries.size > 50000)
    throw new Error("Public sitemap exceeds 50,000 URLs; split into sitemap groups");
  return [...entries.values()];
}
