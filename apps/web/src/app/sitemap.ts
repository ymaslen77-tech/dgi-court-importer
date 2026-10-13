import type { MetadataRoute } from 'next';
import { getPages } from '@/lib/webflow';
import { INDEXING_ENABLED, canonicalUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!INDEXING_ENABLED) return [];
  return getPages().map((page) => ({
    url: canonicalUrl('/' + page.slug),
    changeFrequency: 'monthly',
    priority: page.slug ? 0.7 : 1,
  }));
}
