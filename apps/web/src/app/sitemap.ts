import type { MetadataRoute } from "next";
import { siteIsLive, siteOrigin } from "@/data/pages";
import { listPublishedEditorialSlugs } from "@/data/published";
import { listPublishedCourtActSlugs,courtActBasePath } from "@/data/court-fulltext";

export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Never expose CMS slugs on staging; the site cutover gate remains mandatory.
  if (!siteIsLive) return [];
  const slugs = (await listPublishedEditorialSlugs()).filter(slug =>
    slug !== "sudebnaya-praktika-dgi" && !slug.startsWith("dgi-court-cases/"));
  const editorial = slugs.sort().map(slug => ({
    url: new URL(slug ? `/${slug}` : "/", siteOrigin).toString(),
    changeFrequency: "monthly" as const,
    priority: slug === "" ? 1 : 0.7,
  }));
  // Court acts enter the sitemap only after per-document review and live release.
  const acts=await listPublishedCourtActSlugs();
  const courtPages=acts.map(act=>({
    url:new URL(`${courtActBasePath}/${act.slug}`,siteOrigin).toString(),
    lastModified:new Date(act.updated_at),
    changeFrequency:"monthly" as const,
    priority:0.7,
  }));
  if(acts.length) courtPages.unshift({
    url:new URL(courtActBasePath,siteOrigin).toString(),
    lastModified:new Date(acts.reduce((v,a)=>a.updated_at>v?a.updated_at:v,acts[0].updated_at)),
    changeFrequency:"monthly" as const,
    priority:0.7,
  });
  if(editorial.length+courtPages.length>50000)
    throw new Error("Public sitemap exceeds 50k pages; split into sitemap groups");
  return [...editorial,...courtPages];
}
