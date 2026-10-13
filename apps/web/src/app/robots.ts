import type { MetadataRoute } from 'next';
import { INDEXABLE, absoluteUrl } from '../lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: INDEXABLE
      ? { userAgent: '*', allow: '/' }
      : { userAgent: '*', disallow: '/' },
    ...(INDEXABLE ? { sitemap: absoluteUrl('/sitemap.xml') } : {}),
  };
}
