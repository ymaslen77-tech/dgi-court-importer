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

// Production publication requires three independent settings. A mistakenly
// enabled SITE_CUTOVER alone must not expose unreviewed static snapshots.
function approvedProductionOrigin(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        url.pathname !== "/" || url.search || url.hash ||
        ["localhost", "127.0.0.1", "dgimos.webflow.io"].includes(host) ||
        host.endsWith(".webflow.io") || host.endsWith(".webflow.com")) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}
const releaseOrigin = approvedProductionOrigin(process.env.SITE_URL);
export const siteIsLive =
  process.env.SITE_CUTOVER === "true" &&
  process.env.SITE_RELEASE_APPROVED === "yes" &&
  Boolean(releaseOrigin);
export const siteOrigin = siteIsLive ? releaseOrigin! : "https://dgi-housing-preview.vercel.app";

export function canonicalUrl(page: MigratedPage): string {
  return siteIsLive
    ? new URL(page.slug ? `/${page.slug}` : "/", siteOrigin).toString()
    : page.source;
}
