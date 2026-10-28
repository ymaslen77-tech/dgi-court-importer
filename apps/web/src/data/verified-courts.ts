import "server-only";
import curatedSnapshot from "./verified-court-static.json";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** A court record describes an act, never a promised victory by either party. */
export type CourtDisposition =
  | "applicant_granted" | "applicant_partially_granted"
  | "claim_granted" | "claim_denied" | "mixed" | "remanded" | "not_classified";
export type VerifiedCase = {
  slug: string;
  case_number: string;
  court_name: string;
  decision_date: string;
  act_type: string;
  topic: string;
  official_url: string;
  official_pdf_url: string;
  pdf_sha256: string;
  excerpt: string;
  pdf_origin?: "site_rendered_copy" | "court_original";
  outcome_verified: CourtDisposition;
  outcome_evidence: string;
};
type CourtSourceCase = VerifiedCase & {
  full_text: string;
  full_text_sha256: string;
  source_checked: boolean;
  privacy_checked?: boolean; // legacy independently reviewed records
  privacy_screen_passed?: boolean; // new automated source-only screen, not human approval
};
const curatedCases = curatedSnapshot as unknown as CourtSourceCase[];
const verifiedQueryMaxLength = 100;

export function verifiedCourtReadsEnabled(): boolean {
  // Database publication remains disabled: do not bypass its access controls.
  return false;
}
const officialHosts = ["mos-gorsud.ru", "sudrf.ru", "vsrf.ru"];
export function isOfficialCourtUrl(value: string): boolean {
  if (!value || value.length > 1900) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password &&
      (!u.port || u.port === "443") &&
      officialHosts.some(host => u.hostname.toLowerCase() === host ||
        u.hostname.toLowerCase().endsWith("." + host));
  } catch { return false; }
}
export function validVerifiedSearch(term: string): string {
  const normalized = term.trim().normalize("NFC");
  if (normalized.length > verifiedQueryMaxLength ||
    /[\x00-\x1f\x7f]/.test(normalized)) throw new RangeError("Некорректный поисковый запрос");
  return normalized;
}
function isOfficialPublishedCase(row: CourtSourceCase): boolean {
  return row.source_checked === true &&
    (row.privacy_checked === true || row.privacy_screen_passed === true) &&
    /^[a-f0-9]{64}$/.test(row.pdf_sha256) &&
    /^[a-f0-9]{64}$/.test(row.full_text_sha256) &&
    /^[a-z0-9][a-z0-9-]{2,159}$/.test(row.slug) &&
    typeof row.full_text === "string" && row.full_text.length >= 4000 &&
    isOfficialCourtUrl(row.official_url);
}
export async function searchVerifiedCourtActs(q: string): Promise<VerifiedCase[]> {
  const term = validVerifiedSearch(q);
  const terms = term.toLocaleLowerCase("ru").split(/\s+/).filter(Boolean);
  return curatedCases.filter(row => isOfficialPublishedCase(row) &&
    terms.every(word => [row.case_number, row.court_name, row.topic, row.full_text]
      .join(" ").toLocaleLowerCase("ru").includes(word))
  ).slice(0, 500).map(({ full_text: _text, full_text_sha256: _sha, source_checked: _source,
    privacy_checked: _legacyPrivacy, privacy_screen_passed: _privacyScreen, ...summary }) => summary);
}
// Public indexing is limited to the same source/privacy-gated static records
// served by the existing court PDF and search endpoints. No CMS draft reads.
export type PublicCourtCase = VerifiedCase & { full_text: string; full_text_sha256: string };
export function getPublicCourtCase(slug: string): PublicCourtCase | undefined {
  if (!/^[a-z0-9][a-z0-9-]{2,159}$/.test(slug)) return undefined;
  const row = curatedCases.find(item => item.slug === slug && isOfficialPublishedCase(item));
  if (!row) return undefined;
  return {
    slug: row.slug, case_number: row.case_number, court_name: row.court_name,
    decision_date: row.decision_date, act_type: row.act_type, topic: row.topic,
    official_url: row.official_url, official_pdf_url: row.official_pdf_url,
    pdf_sha256: row.pdf_sha256, excerpt: row.excerpt, pdf_origin: row.pdf_origin,
    outcome_verified: row.outcome_verified, outcome_evidence: row.outcome_evidence,
    full_text: row.full_text, full_text_sha256: row.full_text_sha256,
  };
}
export function listPublicCourtCaseSlugs(): Array<{ slug: string; decision_date: string }> {
  return curatedCases.filter(isOfficialPublishedCase)
    .map(row => ({ slug: row.slug, decision_date: row.decision_date }));
}

export type VerifiedPdf = { bytes: Buffer; sha256: string; officialPdfUrl: string };
export async function readVerifiedCourtPdf(slug: string): Promise<VerifiedPdf | null> {
  if (!/^[a-z0-9][a-z0-9-]{2,159}$/.test(slug)) return null;
  const row = curatedCases.find(item => item.slug === slug && isOfficialPublishedCase(item));
  if (!row) return null;
  try {
    const bytes = await readFile(join(process.cwd(), "public", "court-pdf-copies", slug + ".pdf"));
    return { bytes, sha256: row.pdf_sha256, officialPdfUrl: row.official_url };
  } catch { return null; }
}
