import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = p => readFileSync(new URL("../../" + p, import.meta.url), "utf8");

test("DGI court page displays only sourced curated acts, never unverified metadata rows", () => {
  const page = read("apps/web/src/app/sudebnaya-praktika-dgi/page.tsx");
  assert.match(page, /VerifiedCourtExplorer/);
  assert.doesNotMatch(page, /listOfficialCandidates|legacyCases|CourtExplorer cases=|CourtDatabaseExplorer/);
  assert.match(page, /Судебная практика по спорам с ДГИ/);
});

test("all outcomes allowed in curated catalog, while gated CMS database publication remains disabled", () => {
  const source = read("apps/web/src/data/verified-courts.ts");
  const ui = read("apps/web/src/components/VerifiedCourtExplorer.tsx");
  for (const term of [
    "isOfficialCourtUrl", "source_checked === true", "privacy_screen_passed === true",
    "privacy_checked === true", "return false;", "not_classified", "full_text_sha256",
  ]) assert.ok(source.includes(term), "Missing static source/integrity safeguard " + term);
  assert.match(source, /outcome_verified: CourtDisposition/);
  assert.match(ui, /Исход — см\. текст судебного акта/);
  assert.match(ui, /В иске отказано/);
  assert.match(ui, /Направлено на новое рассмотрение/);
  assert.doesNotMatch(source, /row\.outcome_verified === "applicant_granted"/);
});

test("PDF copy stays on site, is correctly labeled and SHA256-checked", () => {
  const endpoint = read("apps/web/src/app/api/courts/verified/[slug]/pdf/route.ts");
  const ui = read("apps/web/src/components/VerifiedCourtExplorer.tsx");
  assert.match(endpoint, /readVerifiedCourtPdf/);
  assert.match(endpoint, /createHash\("sha256"\)/);
  assert.match(endpoint, /checksum !== pdf.sha256/);
  assert.match(endpoint, /application\/pdf/);
  assert.match(endpoint, /Content-Disposition/);
  assert.match(ui, /aria-modal="true"/);
  assert.match(ui, /iframe className="court-pdf-frame"/);
  assert.match(ui, /PDF-копия текста, опубликованного судом/);
});

test("database judicial publication controls remain unchanged and inaccessible", () => {
  const migration = read("db/migrations/0006_verified_court_pdf_assets.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS court_act_pdf_assets/);
  assert.match(migration, /approved_at IS NULL OR/);
  assert.match(migration, /revoke_court_pdf_approval/);
  assert.match(migration, /octet_length\(pdf_bytes\) BETWEEN 300 AND 15728640/);
  assert.doesNotMatch(migration, /INSERT INTO court_act_pdf_assets/);
  const source = read("apps/web/src/data/verified-courts.ts");
  assert.match(source, /return false;/);
});

test("curated official decisions may have any outcome, without fabricated outcome classification", () => {
  const cases = JSON.parse(read("apps/web/src/data/verified-court-static.json"));
  const permitted = new Set(["applicant_granted","applicant_partially_granted","claim_granted",
    "claim_denied","mixed","remanded","not_classified"]);
  assert.ok(cases.length >= 6);
  const numbers=new Set(), urls=new Set();
  for (const c of cases) {
    assert.ok(permitted.has(c.outcome_verified));
    assert.match(c.official_url,/^https:\/\/2kas\.sudrf\.ru\//);
    assert.equal(c.source_checked,true);
    assert.ok(c.privacy_checked===true || c.privacy_screen_passed===true);
    assert.match(c.pdf_sha256,/^[a-f0-9]{64}$/);
    assert.match(c.full_text_sha256,/^[a-f0-9]{64}$/);
    assert.ok(c.full_text.length>4000);
    assert.ok(!numbers.has(c.case_number) && !urls.has(c.official_url));
    numbers.add(c.case_number);urls.add(c.official_url);
    assert.ok(c.outcome_evidence.length>=40);
  }
  const importer = read("scripts/prepare_dgi_all_outcome_courts.py");
  assert.match(importer,/not_classified/);
  assert.match(importer,/full_official_court_act/);
  assert.match(importer,/PASSPORT/);
});
