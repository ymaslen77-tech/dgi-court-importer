import type { MetadataRoute } from "next";
import { siteIsLive, siteOrigin } from "@/data/pages";

export default function robots(): MetadataRoute.Robots {
  return siteIsLive ? {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteOrigin).toString(),
  } : {
    rules: { userAgent: "*", disallow: "/" },
  };
}
