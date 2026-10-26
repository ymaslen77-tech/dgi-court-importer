import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = p => readFileSync(new URL("../../" + p, import.meta.url), "utf8");
test("public court section never lists unverifiable legacy or case-only candidates", () => {
  const page = read("apps/web/src/app/sudebnaya-praktika-dgi/page.tsx");
  assert.match(page, /VerifiedCourtExplorer/);
  assert.doesNotMatch(page, /listOfficialCandidates|legacyCases|CourtExplorer cases=|CourtDatabaseExplorer/);
});
test("only judicial acts with source, privacy, publication and approved PDF are eligible", () => {
  const source = read("apps/web/src/data/verified-courts.ts");
  for (const term of [
    "COURT_VERIFIED_PUBLIC_READS", "COURT_POSITIVE_ONLY_DB_READS", "d.status='published'",
    "d.source_checked_at IS NOT NULL", "d.text_verified_at IS NOT NULL",
    "d.privacy_checked_at IS NOT NULL", "d.published_at<=now()",
    "p.approved_at IS NOT NULL", "p.privacy_checked_at IS NOT NULL",
    "JOIN court_act_pdf_assets", "to_tsvector('russian', d.full_text)",
  ]) assert.ok(source.includes(term), "Missing safeguard " + term);
});
test("PDF is original stored bytes only and integrity-checked; iframe stays in our site", () => {
  const endpoint = read("apps/web/src/app/api/courts/verified/[slug]/pdf/route.ts");
  const ui = read("apps/web/src/components/VerifiedCourtExplorer.tsx");
  assert.match(endpoint, /readVerifiedCourtPdf/);
  assert.match(endpoint, /createHash\("sha256"\)/);
  assert.match(endpoint, /checksum !== pdf.sha256/);
  assert.match(endpoint, /application\/pdf/);
  assert.match(endpoint, /Content-Disposition/);
  assert.match(ui, /role="dialog"/);
  assert.match(ui, /aria-modal="true"/);
  assert.match(ui, /iframe className="court-pdf-frame"/);
  assert.match(ui, /\/api\/courts\/verified\//);
});
test("public PDF asset schema starts empty and revokes approval on changes", () => {
  const migration = read("db/migrations/0006_verified_court_pdf_assets.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS court_act_pdf_assets/);
  assert.match(migration, /approved_at IS NULL OR/);
  assert.match(migration, /revoke_court_pdf_approval/);
  assert.match(migration, /octet_length\(pdf_bytes\) BETWEEN 300 AND 15728640/);
  assert.doesNotMatch(migration, /INSERT INTO court_act_pdf_assets/);
});

test("only claimant-favorable acts remain public", () => {
  const cases=JSON.parse(read("apps/web/src/data/verified-court-static.json"));
  assert.ok(cases.length>=3);
  assert.ok(cases.every(c=>["applicant_granted","applicant_partially_granted"].includes(c.outcome_verified)));
  assert.ok(cases.every(c=>typeof c.outcome_evidence==="string" && c.outcome_evidence.length>=40));
  assert.ok(cases.every(c=>c.case_number!=="88-724/2026"));
  const src=read("scripts/build-official-court-pdf-copies.py");
  assert.ok(!src.includes('"slug": "2kas-88-724-2026-2026-01-20"'));
  assert.ok(src.includes("positive_outcome"));
  const migration=read("db/migrations/0007_positive_claimant_outcome.sql");
  assert.match(migration,/court_act_positive_public_guard/);
});
