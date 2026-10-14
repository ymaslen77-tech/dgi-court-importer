// Visual category based on inspected, published Webflow reference pages.
// Other routes retain the existing template until individually compared.
const thematicSlugs=new Set([
  "privatizaciya-zhilya",
  "socialnyj-naem",
  "renovaciya-pereselenie",
]);
export function isThematicSlug(slug: string): boolean {
  return thematicSlugs.has(slug);
}
