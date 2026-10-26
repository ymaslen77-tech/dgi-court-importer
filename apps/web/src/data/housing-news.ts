import rows from "./housing-news.json";

export type HousingNewsArticle = {
  slug: string;
  title: string;
  summary: string;
  region: "Москва" | "Московская область";
  category: string;
  publishedAt: string;
  sourcePublishedAt: string;
  sourceUrl: string;
  sourceName: string;
  sections: { heading: string; paragraphs: string[] }[];
};

const allowedHosts = ["mos.ru", "mosreg.ru", "garant.ru"];
function isAllowedSource(source: string): boolean {
  try {
    const u = new URL(source);
    const host = u.hostname.toLowerCase();
    return u.protocol === "https:" && !u.username && !u.password &&
      allowedHosts.some(domain => host === domain || host.endsWith("." + domain));
  } catch { return false; }
}
function valid(row: unknown): row is HousingNewsArticle {
  if (!row || typeof row !== "object") return false;
  const x = row as Partial<HousingNewsArticle>;
  return typeof x.slug === "string" && /^[a-z0-9-]{15,125}$/.test(x.slug) &&
    typeof x.title === "string" && x.title.length >= 20 && x.title.length <= 180 &&
    typeof x.summary === "string" && x.summary.length >= 80 && x.summary.length <= 600 &&
    (x.region === "Москва" || x.region === "Московская область") &&
    typeof x.category === "string" && x.category.length >= 3 && x.category.length <= 70 &&
    typeof x.publishedAt === "string" && /^\d{4}-\d{2}-\d{2}T/.test(x.publishedAt) &&
    Number.isFinite(Date.parse(x.publishedAt)) && Date.parse(x.publishedAt) <= Date.now() &&
    typeof x.sourcePublishedAt === "string" && Number.isFinite(Date.parse(x.sourcePublishedAt)) &&
    typeof x.sourceName === "string" && x.sourceName.length > 2 &&
    typeof x.sourceUrl === "string" && isAllowedSource(x.sourceUrl) &&
    Array.isArray(x.sections) && x.sections.length >= 3 && x.sections.length <= 8 &&
    x.sections.every(section => typeof section.heading === "string" && section.heading.length >= 5 &&
      Array.isArray(section.paragraphs) && section.paragraphs.length >= 1 &&
      section.paragraphs.every(p => typeof p === "string" && p.length >= 70 && p.length <= 1200));
}
const articles = (rows as unknown[]).filter(valid);
export function listHousingNews(): HousingNewsArticle[] {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
export function getHousingNews(slug: string): HousingNewsArticle | undefined {
  return articles.find(article => article.slug === slug);
}
export const housingNewsBase = "/novosti-zhilishchnogo-prava";
