import { validateCmsInventory } from "./prepare-cms-inventory.mjs";

const NAMES = new Set([
  "dgi-court-cases", "dgi-legal-documents", "dgi-legal-situations", "housing-law-news",
]);

function text(value, max = 500) {
  if (typeof value !== "string") return null;
  const clean = value.trim().replace(/\s+/g, " ");
  return clean && clean.length <= max ? clean : null;
}
function sourceLink(value, domains) {
  if (typeof value !== "string" || value.length > 2000) return null;
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443") ||
      !domains.some((d) => host === d || host.endsWith("." + d))) return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

export function sanitizeCmsExport(raw) {
  if (!raw || !Array.isArray(raw.collections) || raw.collections.length !== NAMES.size)
    throw new Error("Expected four Webflow source collections");
  const collections = raw.collections.map((collection) => {
    if (!NAMES.has(collection?.slug) || !Array.isArray(collection.items))
      throw new Error("Unknown CMS collection in Webflow export");
    const items = collection.items.map((item) => {
      const f = item.fieldData || {};
      const base = {
        id: item.id, slug: f.slug,
        status: item.isDraft ? "draft" : "legacy_public_unverified",
        verified: false,
      };
      switch (collection.slug) {
        case "dgi-court-cases": {
          const caseNumber = text(f["nomer-dela"], 100);
          if (!caseNumber) throw new Error("No court case number for " + String(item.id));
          return { ...base, title: "Дело № " + caseNumber, metadata: {
            caseNumber, court: text(f.sud), uid: text(f["unikalnyy-identifikator"], 150),
            category: text(f["kategoriya-spora"]),
            officialCaseUrl: sourceLink(f["oficialnyy-istochnik"],
              ["mos-gorsud.ru", "sudrf.ru", "vsrf.ru", "kad.arbitr.ru"]),
          }};
        }
        case "dgi-legal-documents":
          return { ...base, title: text(f.name) || "Правовой документ", metadata: {
            actRef: text(f["nomer-i-data-akta"]), topic: text(f["pravovaya-tema"]),
            officialUrl: sourceLink(f["oficialnaya-ssylka"],
              ["mos.ru", "pravo.gov.ru", "vestnikmoscow.mos.ru"]),
          }};
        case "dgi-legal-situations":
          return { ...base, title: text(f.name) || "Жилищная ситуация", metadata: {
            category: text(f["kategoriya-voprosa"]),
            siteSection: sourceLink(f["razdel-sayta"], ["dgimos.webflow.io"]),
          }};
        case "housing-law-news":
          return { ...base, title: text(f.name) || "Новость", metadata: {
            category: text(f.rubrika), source: text(f["istochnik-publikacii"]),
            sourceUrl: sourceLink(f["url-pervoistochnika"],
              ["garant.ru", "consultant.ru", "mos.ru"]),
            sourceDate: text(f["data-istochnika"], 100),
          }};
      }
    }).sort((a, b) => a.slug.localeCompare(b.slug));
    return { slug: collection.slug, sourceCollectionId: collection.id, items };
  }).sort((a, b) => a.slug.localeCompare(b.slug));
  const sanitized = {
    source: "Sanitized Webflow CMS export; no raw editorial content",
    siteId: "6aca6bde03aad0f2e3c19259",
    editorialGate: "unverified; never auto-publish",
    collections,
  };
  validateCmsInventory(sanitized);
  return sanitized;
}
