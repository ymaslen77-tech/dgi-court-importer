import batch0 from "./pages-0.json";
import batch1 from "./pages-1.json";
import batch2 from "./pages-2.json";
import batch3 from "./pages-3.json";
import batch4 from "./pages-4.json";
import batch5 from "./pages-5.json";
import existingOwnerRelease from "./owner-released-legacy-pages.json";

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
  editoriallyApproved?: boolean;
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
        host.endsWith(".webflow.io") || host.endsWith(".webflow.com") ||
        (host !== "dgi-pravo.ru" &&
          !(process.env.CI === "true" &&
            process.env.DATABASE_URL?.includes("housing_ci") &&
            host === "example.org"))) return undefined;
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
export const siteOrigin = siteIsLive ? releaseOrigin! : "http://localhost:3000";

// Public legacy articles existed on the owner's site before the CMS migration.
// The owner has explicitly authorized indexing this fixed 33-page inventory.
// This is an editorial publishing instruction, NOT a fabricated legal signoff.
// Unknown/new CMS rows, unlisted pages, and unpublished documents do not inherit it.
const ownerReleasedLegacySlugs = new Set<string>(existingOwnerRelease.approved_existing_slugs);
function isOwnerReleasedLegacyPage(page: MigratedPage): boolean {
  return ownerReleasedLegacySlugs.has(page.slug) &&
    getMigratedPage(page.slug) === page &&
    page.source === new URL(page.slug ? "/" + page.slug : "/", "https://dgimos.webflow.io").toString() &&
    page.blocks.length >= 5 &&
    page.seoTitle.trim().length >= 20 &&
    page.description.trim().length >= 60;
}
export function listOwnerReleasedLegacySlugs(): string[] {
  return migratedPages.filter(isOwnerReleasedLegacyPage).map(page => page.slug);
}
export function canIndexPage(page: MigratedPage): boolean {
  if (siteIsLive && page.editoriallyApproved === true) return true;
  return siteIsLive && isOwnerReleasedLegacyPage(page);
}

export function canonicalUrl(page: MigratedPage): string {
  return siteIsLive
    ? new URL(page.slug ? `/${page.slug}` : "/", siteOrigin).toString()
    : page.source;
}
