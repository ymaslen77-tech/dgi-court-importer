export const SITE_NAME = 'Единая справочная служба Москвы по жилищным вопросам';
export const SOURCE_SITE = 'https://dgimos.webflow.io';

// Safe staging defaults. Do not make the preview compete with the Webflow site.
export const CANONICAL_ORIGIN = (
  process.env.NEXT_PUBLIC_SITE_ORIGIN || SOURCE_SITE
).replace(/\/$/, '');
export const INDEXING_ENABLED = process.env.ENABLE_INDEXING === 'true';

export function canonicalUrl(path: string): string {
  return CANONICAL_ORIGIN + (path.startsWith('/') ? path : '/' + path);
}
