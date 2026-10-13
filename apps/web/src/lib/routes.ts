import pages from '../data/webflow-pages.json';
import { WEBFLOW_ORIGIN } from './site';

export type RouteEntry = (typeof pages)[number];
export const routes: RouteEntry[] = pages;

export function findRoute(slug: string): RouteEntry | undefined {
  return routes.find((p) => p.slug === slug);
}

export function sourceUrl(slug: string): string {
  const page = findRoute(slug);
  if (!page) throw new Error('Unknown Webflow slug');
  return WEBFLOW_ORIGIN + '/' + encodeURIComponent(page.slug);
}

export function routeHref(slug: string): string {
  const page = findRoute(slug);
  if (!page) return '/';
  return page.migrated || slug === 'sudebnaya-praktika-dgi'
    ? '/' + slug
    : sourceUrl(slug);
}
