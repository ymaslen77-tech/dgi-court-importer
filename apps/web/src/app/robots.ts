import type { MetadataRoute } from 'next';
import { INDEXING_ENABLED, canonicalUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: INDEXING_ENABLED
      ? { userAgent: '*', allow: '/' }
      : { userAgent: '*', disallow: '/' },
    sitemap: INDEXING_ENABLED ? canonicalUrl('/sitemap.xml') : undefined,
  };
}
