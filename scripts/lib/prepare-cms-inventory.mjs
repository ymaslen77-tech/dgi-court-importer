import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCHEMA = Object.freeze({
  "dgi-court-cases": ["caseNumber", "court", "uid", "category", "officialCaseUrl"],
  "dgi-legal-documents": ["actRef", "topic", "officialUrl"],
  "dgi-legal-situations": ["category", "siteSection"],
  "housing-law-news": ["category", "source", "sourceUrl", "sourceDate"],
});
const SOURCE_HOSTS = Object.freeze({
  officialCaseUrl: ["mos-gorsud.ru", "sudrf.ru", "vsrf.ru", "kad.arbitr.ru"],
  officialUrl: ["mos.ru", "pravo.gov.ru", "vestnikmoscow.mos.ru"],
  siteSection: ["dgimos.webflow.io"],
  sourceUrl: ["garant.ru", "consultant.ru", "mos.ru"],
});

function validUrl(value, allowedHosts) {
  if (value === null) return true;
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === "https:" && !parsed.username && !parsed.password &&
      (!parsed.port || parsed.port === "443") &&
      allowedHosts.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

export function validateCmsInventory(snapshot) {
  if (!snapshot || !Array.isArray(snapshot.collections) ||
    snapshot.collections.length !== Object.keys(SCHEMA).length)
    throw new Error("Unexpected CMS snapshot collection count");
  const records = [], keys = new Set(), slugs = new Set(), collections = new Set();
  for (const collection of snapshot.collections) {
    const type = collection?.slug;
    if (!Object.hasOwn(SCHEMA, type) || collections.has(type) || !Array.isArray(collection.items))
      throw new Error("Unsupported or repeated CMS collection: " + type);
    collections.add(type);
    for (const source of collection.items) {
      if (!source || !/^[a-f0-9]{24}$/.test(source.id || "") ||
        !/^[a-z0-9-]+$/.test(source.slug || "") ||
        !["draft", "legacy_public_unverified"].includes(source.status) ||
        source.verified !== false ||
        typeof source.title !== "string" || source.title.length < 1 || source.title.length > 500)
        throw new Error("Invalid or publishable CMS record: " + String(source?.slug));
      const key = type + ":" + source.id, slugKey = type + ":" + source.slug;
      if (keys.has(key) || slugs.has(slugKey)) throw new Error("Duplicate CMS source: " + key);
      keys.add(key); slugs.add(slugKey);
      const data = source.metadata;
      const expectedKeys = SCHEMA[type];
      if (!data || typeof data !== "object" || Array.isArray(data) ||
        Object.keys(data).length !== expectedKeys.length ||
        Object.keys(data).some((k) => !expectedKeys.includes(k)))
        throw new Error("Unapproved CMS metadata fields: " + key);
      for (const field of expectedKeys) {
        const value = data[field];
        if (!Object.hasOwn(data, field) || (value !== null &&
          (typeof value !== "string" || value.length > 2000)))
          throw new Error("Bad CMS metadata value: " + key + ":" + field);
        if (Object.hasOwn(SOURCE_HOSTS, field) && !validUrl(value, SOURCE_HOSTS[field]))
          throw new Error("Untrusted CMS source URL: " + key + ":" + field);
      }
      // A case can be a candidate, never a verified judicial conclusion.
      if (type === "dgi-court-cases" && !source.title.startsWith("Дело № "))
        throw new Error("Court title must not assert an unverified outcome: " + key);
      records.push({
        collection: type, id: source.id, slug: source.slug, title: source.title,
        sourceStatus: source.status, metadata: data, editorialStatus: "review",
        verified: false, publicationAllowed: false,
      });
    }
  }
  return { records, counts: {
    total: records.length,
    collections: Object.fromEntries(Object.keys(SCHEMA).map((key) =>
      [key, records.filter((r) => r.collection === key).length])),
    legacyPublicUnverified: records.filter((r) => r.sourceStatus === "legacy_public_unverified").length,
    publications: 0,
  } };
}

export function prepareCmsInventory(root = process.cwd()) {
  const file = resolve(root, "migration/cms-inventory.json");
  const snapshot = JSON.parse(readFileSync(file, "utf8"));
  return validateCmsInventory(snapshot);
}
