import batch0 from "./pages-0.json";
import batch1 from "./pages-1.json";
import batch2 from "./pages-2.json";
import batch3 from "./pages-3.json";
import batch4 from "./pages-4.json";
import batch5 from "./pages-5.json";

export type MigratedBlock = {
  kind: "h1" | "h2" | "h3" | "h4" | "p" | "link";
  text: string;
  href?: string;
};

export type MigratedPage = {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  source: string;
  blocks: MigratedBlock[];
};

export const migratedPages: MigratedPage[] = [
  ...batch0,
  ...batch1,
  ...batch2,
  ...batch3,
  ...batch4,
  ...batch5,
] as MigratedPage[];

export function getMigratedPage(slug: string): MigratedPage | undefined {
  return migratedPages.find((page) => page.slug === slug);
}

export function canonicalUrl(page: MigratedPage): string {
  const published = process.env.SITE_CUTOVER === "true";
  const origin = process.env.SITE_URL || "https://dgimos.webflow.io";
  return published
    ? new URL(page.slug ? `/${page.slug}` : "/", origin).toString()
    : page.source;
}

export const siteIsLive = process.env.SITE_CUTOVER === "true";
export const siteOrigin = process.env.SITE_URL || "https://dgimos.webflow.io";
