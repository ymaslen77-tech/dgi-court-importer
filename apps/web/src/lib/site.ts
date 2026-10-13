export const SITE_NAME = 'Единая справочная служба Москвы по жилищным вопросам';
export const WEBFLOW_ORIGIN = 'https://dgimos.webflow.io';
export const SITE_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const INDEXABLE = process.env.SITE_INDEXABLE === 'true';

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}
