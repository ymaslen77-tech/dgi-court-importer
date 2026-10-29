import type { MetadataRoute } from "next";
import { siteIsLive, siteOrigin } from "@/data/pages";

// Next.js caches metadata route handlers by default. Evaluate the Coolify
// release flags per request so a closed build cannot freeze production robots.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!siteIsLive) return {
    // Verification HTML remains accessible while all previews stay closed.
    rules: { userAgent:"*", allow: "/yandex_6ade8e55ebfc38d1.html", disallow: "/" },
  };
  return {
    // Public HTML pages, news and official judicial acts are crawlable.
    rules: { userAgent:"*", allow:"/", disallow:["/admin/","/api/"] },
    sitemap: new URL("/sitemap.xml",siteOrigin).toString(),
    host: new URL(siteOrigin).host,
  };
}
