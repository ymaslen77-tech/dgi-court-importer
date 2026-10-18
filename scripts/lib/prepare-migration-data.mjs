import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const courts = ["mos-gorsud.ru", "sudrf.ru", "vsrf.ru", "kad.arbitr.ru"];
export function officialCourtUrl(value) {
  if (typeof value !== "string" || value.length > 1900) return null;
  try {
    const u = new URL(value), host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.username || u.password || (u.port && u.port !== "443")) return null;
    if (!courts.some((d) => host === d || host.endsWith("." + d))) return null;
    u.hash = "";
    return u.toString();
  } catch { return null; }
}
const read = (path) => JSON.parse(readFileSync(path, "utf8"));
export function prepareMigrationData(root = process.cwd()) {
  const pages = Array.from({ length: 6 }, (_, i) =>
    read(resolve(root, "apps/web/src/data/pages-" + i + ".json"))).flat();
  const seen = new Set();
  for (const p of pages) {
    if (typeof p.slug !== "string" || !/^[a-z0-9-]*$/.test(p.slug) || seen.has(p.slug))
      throw new Error("Invalid or duplicate page slug: " + p.slug);
    seen.add(p.slug);
    if (!p.title || !p.seoTitle || !Array.isArray(p.blocks) || !p.blocks.length ||
        p.source !== "https://dgimos.webflow.io/" + p.slug)
      throw new Error("Invalid page provenance/content: " + p.slug);
  }
  const legacy = read(resolve(root, "apps/web/src/data/legacy-cases.json")).cases;
  const official = readFileSync(resolve(root, "data/court-catalog.jsonl"), "utf8")
    .split(/\r?\n/).filter(Boolean).map(JSON.parse);
  const cases = [], keys = new Set();
  for (const item of official) {
    const url = officialCourtUrl(item.official_case_url);
    if (item.verification !== "case_metadata_only" || item.act_reviewed !== false ||
        !item.id || !item.number || !item.court || !url)
      throw new Error("Unverified or invalid official court record");
    const key = "official:" + item.id;
    if (keys.has(key)) throw new Error("Duplicate official case: " + key);
    keys.add(key);
    cases.push({ key, uid: item.uid || null, number: item.number, court: item.court,
      topic: item.category || "Требует классификации", officialUrl: url,
      publisher: new URL(url).hostname, verification: "candidate", actVerified: false });
  }
  for (const item of legacy) {
    if (!item.id || !item.caseNumber || !item.court || item.verifiedAct !== false)
      throw new Error("Legacy case requires editorial review");
    const key = "webflow:" + item.id;
    if (keys.has(key)) throw new Error("Duplicate Webflow record");
    keys.add(key);
    // Secondary titles may assert unverified outcomes. Do not copy those titles.
    cases.push({ key, uid: null, number: item.caseNumber, court: item.court,
      topic: item.category || "Требует классификации", officialUrl: null,
      publisher: null, verification: "review", actVerified: false });
  }
  return { pages, cases, counts: { pages: pages.length, officialCandidates: official.length,
    legacyUnverifiedCases: legacy.length, candidateRows: cases.length } };
}
