import type { MetadataRoute } from "next";
import { siteIsLive, siteOrigin } from "@/data/pages";

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
