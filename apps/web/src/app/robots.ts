import type { MetadataRoute } from "next";
import { siteIsLive, siteOrigin } from "@/data/pages";

export default function robots(): MetadataRoute.Robots {
  return siteIsLive ? {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteOrigin).toString(),
  } : {
    // Ownership verification may be fetched while all editorial pages remain closed.
    rules: { userAgent: "*", allow: "/yandex_6ade8e55ebfc38d1.html", disallow: "/" },
  };
}
