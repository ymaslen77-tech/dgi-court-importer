export const SITE_NAME = 'Единая справочная служба Москвы по жилищным вопросам';
export const WEBFLOW_ORIGIN = 'https://dgimos.webflow.io';
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
// Indexing requires an explicit opt-in AND a configured HTTPS production origin.
export const INDEXABLE = process.env.SITE_INDEXABLE === 'true' &&
  /^https:\/\/[^/]+/.test(process.env.NEXT_PUBLIC_SITE_URL || '');

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}
