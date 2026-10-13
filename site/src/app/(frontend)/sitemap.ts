import type { MetadataRoute } from 'next'
import { indexingEnabled, siteUrl } from '@/lib/site'
import { legacyPages } from '@/lib/legacy-pages'
export default function sitemap(): MetadataRoute.Sitemap {
  if (!indexingEnabled) return []
  return legacyPages.filter(p => !p.isInternal && p.slug !== 'sudebnaya-praktika-dgi').map(p => ({ url: new URL(p.slug ? '/' + p.slug : '/', siteUrl).toString() }))
}
