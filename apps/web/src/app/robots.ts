import type { MetadataRoute } from "next";
import { indexingEnabled } from "@/lib/seo";
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: "*", allow: indexingEnabled ? "/" : undefined, disallow: indexingEnabled ? undefined : "/" }] };
}
