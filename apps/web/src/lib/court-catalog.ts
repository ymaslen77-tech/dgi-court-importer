import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type CourtCandidate = {
  id: string;
  court: string;
  number: string;
  uid: string;
  category: string;
  topics: string[];
  official_case_url: string;
  act_reviewed: boolean;
  verification: string;
  dgi_party: boolean;
};

export async function getCourtCandidates(): Promise<CourtCandidate[]> {
  // Root-level catalog stays under the original Python importer ownership.
  const configured = process.env.COURT_CATALOG_PATH;
  const paths = configured
    ? [resolve(configured)]
    : [
        resolve(process.cwd(), "../../data/court-catalog.jsonl"),
        resolve(process.cwd(), "data/court-catalog.jsonl"),
      ];
  let content = "";
  for (const path of paths) {
    try {
      content = await readFile(path, "utf8");
      break;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") throw error;
    }
  }
  if (!content) return [];

  const rows: CourtCandidate[] = [];
  for (const raw of content.split(/\r?\n/)) {
    if (!raw.trim()) continue;
    let item: CourtCandidate;
    try {
      item = JSON.parse(raw) as CourtCandidate;
    } catch {
      continue;
    }
    if (
      !item.id ||
      !item.number ||
      !item.court ||
      !Array.isArray(item.topics) ||
      item.verification !== "case_metadata_only"
    ) continue;
    // Do not render any non-official or malformed outbound case links.
    try {
      const url = new URL(item.official_case_url);
      if (url.protocol !== "https:" ||
        !/(^|\.)(sudrf\.ru|mos-gorsud\.ru|vsrf\.ru|arbitr\.ru)$/.test(url.hostname)) continue;
    } catch {
      continue;
    }
    rows.push(item);
  }
  return rows.sort((a, b) => a.number.localeCompare(b.number, "ru"));
}
