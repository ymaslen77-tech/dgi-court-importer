import { strict as assert } from "node:assert";
import { test } from "node:test";
import { sanitizeCmsExport } from "../lib/sanitize-webflow-cms.mjs";
import { validateCmsInventory } from "../lib/prepare-cms-inventory.mjs";

const fixtures = () => ({ collections: [
  { id: "c1", slug: "dgi-court-cases", items: [{
    id: "a".repeat(24), isDraft: false,
    fieldData: {
      slug: "court-example", "nomer-dela": "2-100/2025",
      sud: "Районный суд Москвы",
      "oficialnyy-istochnik": "https://2kas.sudrf.ru/modules.php?case_id=123",
      "rezultat-rassmotreniya": "PRIVATE_UNVERIFIED_OUTCOME",
      "pravovaya-poziciya": "PRIVATE_UNVERIFIED_LEGAL_CLAIM",
      "opisanie-obstoyatelstv": "PRIVATE_CASE_CONTENT",
      parties: "PRIVATE_PERSON_NAME",
    },
  }] },
  { id: "c2", slug: "dgi-legal-documents", items: [{
    id: "b".repeat(24), isDraft: true,
    fieldData: { slug: "act-test", name: "Постановление — справка",
      "oficialnaya-ssylka": "https://mos.ru/document.pdf",
      "primechaniya-k-primeneniyu": "PRIVATE_EDITORIAL_COMMENT" },
  }] },
  { id: "c3", slug: "dgi-legal-situations", items: [{
    id: "c".repeat(24), isDraft: true,
    fieldData: { slug: "situation-test", name: "Жилищная ситуация",
      "razdel-sayta": "https://dgimos.webflow.io/spory-s-dgi",
      "opisanie-problemy": "PRIVATE_UNPUBLISHED_BODY" },
  }] },
  { id: "c4", slug: "housing-law-news", items: [{
    id: "d".repeat(24), isDraft: true,
    fieldData: { slug: "news-test", name: "Изменения ЖКХ",
      "url-pervoistochnika": "https://www.garant.ru/news/12345/",
      "chto-izmenilos": "PRIVATE_UNREVIEWED_ARTICLE" },
  }] },
] });

test("sanitizer preserves safe pointers but omits raw legal content", () => {
  const result = sanitizeCmsExport(fixtures());
  const inventory = validateCmsInventory(result);
  assert.equal(inventory.counts.total, 4);
  assert.equal(inventory.counts.legacyPublicUnverified, 1);
  assert.ok(inventory.records.every((r) => !r.verified && !r.publicationAllowed));
  const str = JSON.stringify(result);
  for (const prohibited of [
    "PRIVATE_UNVERIFIED_OUTCOME", "PRIVATE_UNVERIFIED_LEGAL_CLAIM",
    "PRIVATE_CASE_CONTENT", "PRIVATE_PERSON_NAME", "PRIVATE_EDITORIAL_COMMENT",
    "PRIVATE_UNPUBLISHED_BODY", "PRIVATE_UNREVIEWED_ARTICLE",
  ]) assert.ok(!str.includes(prohibited));
  assert.match(str, /https:\/\/2kas\.sudrf\.ru/);
});
test("fake court source URLs are dropped", () => {
  const exportData = fixtures();
  exportData.collections[0].items[0].fieldData["oficialnyy-istochnik"] =
    "https://sudrf.ru.attacker.invalid/modules.php";
  const result = sanitizeCmsExport(exportData);
  assert.equal(result.collections[0].items[0].metadata.officialCaseUrl, null);
});
