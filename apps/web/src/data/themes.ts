// Source-grounded presentation categories from 33 paired Webflow/Next.js
// Chromium screenshots (desktop and mobile), GitHub Actions run 38548757853.
// Only the page presentation changes: migrated legal text is NOT approved.
export const lightReferenceSlugs = [
  "dokumenty-na-kvartiru",
  "funkcii-dgi",
  "gorodskoe-imushchestvo-i-zemlya",
  "gosuslugi-dgi",
  "kadastrovaya-stoimost",
  "kontakty-dgi",
  "normativnye-akty",
  "privatizaciya-zhilya",
  "renovaciya-pereselenie",
  "socialnyj-naem",
  "spory-s-dgi",
  "sudebnaya-praktika-dgi",
  "zhilishchnaya-ochered",
  "zhilishchnye-subsidii",
  "zhilishchnyj-uchet",
] as const;
const lightSlugs: ReadonlySet<string> = new Set(lightReferenceSlugs);
export function isThematicSlug(slug: string): boolean {
  return lightSlugs.has(slug);
}
