import type { MetadataRoute } from 'next'
import { indexingEnabled, siteUrl } from '@/lib/site'
export default function robots(): MetadataRoute.Robots {
  return indexingEnabled ? { rules: { userAgent: '*', allow: '/' }, sitemap: new URL('/sitemap.xml', siteUrl).toString() } : { rules: { userAgent: '*', disallow: '/' } }
}
