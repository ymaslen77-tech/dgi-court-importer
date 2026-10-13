import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import published from "./legacy-cases.json";

export type CourtCandidate = {
  id: string;
  number: string;
  court: string;
  uid: string;
  category: string;
  topics: string[];
  official_case_url: string;
  verification: "case_metadata_only";
  act_reviewed: boolean;
};

export type LegacyCase = {
  id: string;
  caseNumber: string;
  court: string;
  category: string;
  officialUrl: string;
  verifiedAct: boolean;
  verification: string;
};

export function listOfficialCandidates(): CourtCandidate[] {
  const path = process.env.COURT_CATALOG_PATH ||
    resolve(process.cwd(), "../../data/court-catalog.jsonl");
  try {
    return readFileSync(path, "utf8").split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as CourtCandidate)
      .filter((item) => item.verification === "case_metadata_only");
  } catch {
    // The court index is optional for an isolated frontend deploy.
    return [];
  }
}

export const legacyCases: LegacyCase[] = published.cases as LegacyCase[];
