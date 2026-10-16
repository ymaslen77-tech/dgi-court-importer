import { createHash } from "node:crypto";

// Exact field allowlist of the four original CMS collections.
export const WEBFLOW_PRIVATE_FIELDS: Record<string, {id: string; keys: readonly string[]}> = {
  "dgi-court-cases": {
    id: "6aca8b43f741d6755539f345",
    keys: [
      "nomer-dela", "sud", "data-resheniya", "tip-suda",
      "kategoriya-spora", "rezultat-rassmotreniya", "opisanie-obstoyatelstv",
      "pravovaya-poziciya", "oficialnyy-istochnik",
      "publikaciya-sudebnogo-akta", "unikalnyy-identifikator",
      "status-peresmotra", "poiskovye-temy", "data-proverki",
      "status-verifikacii", "psevdonimy-formulirovki",
      "istochnik-pravovyh-norm", "kratkoe-soderzhanie",
      "kod-kategorii", "kod-rezultata", "istochnik-nabora-dannyh",
      "klyuch-deduplikacii", "data-importa",
      "rezultat-mashinnoy-proverki", "svyazannye-nomera-instanciy",
      "sudebnaya-instanciya", "identifikator-sudebnogo-spora",
      "istoriya-peresmotra", "sudebnyy-akt-proveren",
      "tema-zhiznennoy-situacii", "name", "slug",
    ],
  },
  "dgi-legal-documents": {
    id: "6acbb1ca75f0fd4e89dba736",
    keys: [
      "nomer-i-data-akta", "pravovaya-tema", "oficialnaya-ssylka",
      "data-redakcii-istochnika", "data-ruchnoy-proverki",
      "status-aktualnosti", "svyazannye-zhiznennye-situacii",
      "primechaniya-k-primeneniyu", "name", "slug",
    ],
  },
  "dgi-legal-situations": {
    id: "6acbb1cb3b6b24eada522db4",
    keys: [
      "kategoriya-voprosa", "opisanie-problemy", "kakie-dokumenty-sobrat",
      "pervonachalnye-deystviya", "svyazannye-normativnye-akty",
      "razdel-sayta", "status-yuridicheskoy-proverki", "name", "slug",
    ],
  },
  "housing-law-news": {
    id: "6acbbe75ee81535770a2bff7",
    keys: [
      "rubrika", "data-sobytiya", "data-istochnika",
      "istochnik-publikacii", "url-pervoistochnika",
      "url-normativnogo-akta", "kratkiy-anons", "chto-izmenilos",
      "kogo-kasaetsya", "chto-delat", "status-verifikacii",
      "klyuch-pervoistochnika", "temy-zhilishchnogo-prava",
      "provereno-redaktorom", "name", "slug",
    ],
  },
};
type PinnedItem = {
  id: string; slug: string; status: "draft" | "legacy_public_unverified";
  verified: false;
};
type RawItem = {
  id?: unknown; isDraft?: unknown; fieldData?: unknown; lastUpdated?: unknown;
};
export type PrivateSource = {
  sourceKey: string;
  sourceCollection: string;
  sourceItemId: string;
  sourceSlug: string;
  sourceStatus: "draft" | "legacy_public_unverified";
  sourceUpdatedAt: string | null;
  sourceDigest: string;
  sourceFields: Record<string, string | boolean | null>;
};
export function selectPrivateSource(
  collectionSlug: string, raw: RawItem, pinned: PinnedItem,
): PrivateSource {
  const config = WEBFLOW_PRIVATE_FIELDS[collectionSlug];
  if (!config) throw new Error("Unexpected collection");
  if (!pinned || !/^[a-f0-9]{24}$/.test(pinned.id) ||
      !/^[a-z0-9-]+$/.test(pinned.slug) || pinned.verified !== false ||
      raw?.id !== pinned.id || typeof raw.isDraft !== "boolean")
    throw new Error("Unexpected Webflow item identity");
  const status = raw.isDraft ? "draft" : "legacy_public_unverified";
  if (pinned.status !== status) throw new Error("Webflow publication status changed");
  const fields = raw.fieldData;
  if (!fields || typeof fields !== "object" || Array.isArray(fields))
    throw new Error("Source has no field data");
  const values = fields as Record<string, unknown>;
  if (values.slug !== pinned.slug || typeof values.name !== "string" ||
      values.name.trim().length === 0)
    throw new Error("Webflow slug/name differs from inventory");
  const allowed = new Set(config.keys);
  const unexpected = Object.keys(values).filter((key) => !allowed.has(key));
  if (unexpected.length > 0)
    throw new Error("Webflow schema changed; inspect new field names before import");
  const safeFields: Record<string, string | boolean | null> = {};
  for (const key of config.keys) {
    if (!(key in values)) continue;
    const value = values[key];
    if (value === null) safeFields[key] = null;
    else if (typeof value === "boolean") safeFields[key] = value;
    else if (typeof value === "string" && value.length <= 250_000)
      safeFields[key] = value;
    else throw new Error("Unexpected Webflow field type/size: " + key);
  }
  const updated = raw.lastUpdated;
  if (updated !== null && updated !== undefined &&
      (typeof updated !== "string" || Number.isNaN(Date.parse(updated))))
    throw new Error("Invalid Webflow updated timestamp");
  return {
    sourceKey: collectionSlug + ":" + pinned.id,
    sourceCollection: collectionSlug,
    sourceItemId: pinned.id,
    sourceSlug: pinned.slug,
    sourceStatus: status,
    sourceUpdatedAt: typeof updated === "string" ? updated : null,
    sourceDigest: createHash("sha256").update(JSON.stringify({
      collectionSlug, id: pinned.id, status, fields: safeFields,
    })).digest("hex"),
    sourceFields: safeFields,
  };
}
