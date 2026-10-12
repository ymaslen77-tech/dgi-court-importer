import type { MetadataRoute } from "next";
import { migratedPages } from "@/lib/pages";
import { indexingEnabled, siteOrigin } from "@/lib/seo";
export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexingEnabled) return [];
  const origin = siteOrigin();
  return [
    { url: origin, changeFrequency: "weekly", priority: 1 },
    { url: origin + "/sudebnaya-praktika-dgi", changeFrequency: "weekly", priority: 0.8 },
    ...migratedPages().map((p) => ({ url: origin + "/" + p.slug, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
