import registry from "@/data/webflow-pages.json";
import snapshots from "@/data/webflow-content.json";

export type PageBlock = {
  kind: "h1" | "h2" | "h3" | "p" | "li" | "link";
  text: string;
  href?: string;
};
export type SitePage = {
  slug: string;
  sourcePageId: string;
  title: string;
  description: string;
  status: "ready" | "needs-review";
  sourceUrl: string;
};
type ContentPage = { slug: string; blocks: PageBlock[] };

export const pageInventory = registry.pages as SitePage[];
const pageContent = snapshots.pages as ContentPage[];

export function getPage(slug: string): (SitePage & { blocks: PageBlock[] }) | null {
  const metadata = pageInventory.find((page) => page.slug === slug && page.status === "ready");
  const source = pageContent.find((page) => page.slug === slug);
  if (!metadata || !source || source.blocks.length === 0) return null;
  return { ...metadata, blocks: source.blocks };
}
export function migratedPages(): SitePage[] {
  return pageInventory.filter((page) => getPage(page.slug) !== null);
}
