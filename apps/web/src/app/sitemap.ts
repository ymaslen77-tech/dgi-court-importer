import type { MetadataRoute } from 'next';
import { routes } from '../lib/routes';
import { INDEXABLE, absoluteUrl } from '../lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  if (!INDEXABLE) return [];
  return [
    { url: absoluteUrl('/'), changeFrequency: 'weekly', priority: 1 },
    ...routes.filter((p) => p.migrated).map((p) => ({
      url: absoluteUrl('/' + p.slug),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
