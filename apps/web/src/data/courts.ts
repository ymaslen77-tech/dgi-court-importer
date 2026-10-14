import officialSnapshot from "./official-court-candidates.json";
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
  slug: string;
  caseNumber: string;
  court: string;
  category: string;
  officialUrl: string;
  verifiedAct: boolean;
  verification: string;
};

// Checked-in, privacy-minimal source snapshot. Growing indexes are served
// exclusively through PostgreSQL, not arbitrary server filesystem reads.
// Avoids Next.js tracing the whole repository into a deployment artifact.
export function listOfficialCandidates(): CourtCandidate[] {
  return officialSnapshot.filter((item) =>
    item.verification === "case_metadata_only" && item.act_reviewed === false
  ) as CourtCandidate[];
}

export const legacyCases: LegacyCase[] = published.cases as LegacyCase[];
