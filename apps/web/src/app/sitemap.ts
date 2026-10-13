import type { MetadataRoute } from "next";
import { migratedPages, siteIsLive, siteOrigin } from "@/data/pages";

export default function sitemap(): MetadataRoute.Sitemap {
  // Staging is deliberately excluded from public sitemap distribution.
  if (!siteIsLive) return [];
  return migratedPages.map((p) => ({
    url: new URL(p.slug ? `/${p.slug}` : "/", siteOrigin).toString(),
    changeFrequency: p.slug === "sudebnaya-praktika-dgi" ? "weekly" : "monthly",
    priority: p.slug === "" ? 1 : 0.7,
  }));
}
