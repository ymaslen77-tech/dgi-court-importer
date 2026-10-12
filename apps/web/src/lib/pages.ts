import registry from "@/data/webflow-pages.json";
import snapshot01 from "@/data/snapshot-01.json";
import snapshot02 from "@/data/snapshot-02.json";
import snapshot03 from "@/data/snapshot-03.json";
import snapshot04 from "@/data/snapshot-04.json";
import snapshot05 from "@/data/snapshot-05.json";
import snapshot06 from "@/data/snapshot-06.json";
import snapshot07 from "@/data/snapshot-07.json";

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
const sourceSnapshots = [
  ...snapshot01.pages,
  ...snapshot02.pages,
  ...snapshot03.pages,
  ...snapshot04.pages,
  ...snapshot05.pages,
  ...snapshot06.pages,
  ...snapshot07.pages,
] as unknown as ContentPage[];
const contentMap = new Map(sourceSnapshots.map((page) => [page.slug, page]));
const routeMap = new Map(pageInventory.map((page) => [page.slug, page]));

export function getPage(slug: string): (SitePage & { blocks: PageBlock[] }) | null {
  const metadata = routeMap.get(slug);
  const source = contentMap.get(slug);
  if (!metadata || metadata.status !== "ready" || !source || source.blocks.length === 0) return null;
  return { ...metadata, blocks: source.blocks };
}
export function migratedPages(): SitePage[] {
  return pageInventory.filter((page) => getPage(page.slug) !== null);
}
