export const serviceName = 'Единая справочная служба Москвы по жилищным вопросам'
export const legacyOrigin = 'https://dgimos.webflow.io'
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
export const indexingEnabled = process.env.SITE_PUBLIC_INDEXING === 'true'
export const defaultRobots = { index: indexingEnabled, follow: indexingEnabled }
export function legacyHref(slug: string): string {
  if (!/^[a-z0-9-]*$/.test(slug)) throw new Error('Unsafe legacy slug')
  return slug ? `${legacyOrigin}/${slug}` : `${legacyOrigin}/`
}
