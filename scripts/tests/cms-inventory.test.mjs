import { strict as assert } from "node:assert";
import { test } from "node:test";
import { prepareCmsInventory, validateCmsInventory } from "../lib/prepare-cms-inventory.mjs";
import { readFileSync } from "node:fs";

const source = () => JSON.parse(readFileSync("migration/cms-inventory.json", "utf8"));

test("all 50 Webflow CMS items are preserved as non-publishable metadata", () => {
  const { records, counts } = prepareCmsInventory();
  assert.equal(counts.total, 50);
  assert.deepEqual(counts.collections, {
    "dgi-court-cases": 37,
    "dgi-legal-documents": 4,
    "dgi-legal-situations": 6,
    "housing-law-news": 3,
  });
  assert.equal(counts.legacyPublicUnverified, 22);
  assert.equal(counts.publications, 0);
  assert.equal(new Set(records.map((x) => x.collection + ":" + x.id)).size, 50);
  assert.ok(records.every((x) => !x.verified && !x.publicationAllowed &&
    x.editorialStatus === "review"));
});
test("judicial claims and personal data cannot enter the staging inventory", () => {
  const records = prepareCmsInventory().records.filter((x) => x.collection === "dgi-court-cases");
  assert.equal(records.length, 37);
  assert.ok(records.every((x) => x.title.startsWith("Дело № ")));
  assert.ok(records.every((x) => !Object.hasOwn(x.metadata, "outcome") &&
    !Object.hasOwn(x.metadata, "parties") &&
    !Object.hasOwn(x.metadata, "judgmentSummary") &&
    !Object.hasOwn(x.metadata, "courtActText")));
});
test("reject forged verification or outcome field", () => {
  const forged = source();
  forged.collections[0].items[0].verified = true;
  assert.throws(() => validateCmsInventory(forged), /publishable/);
  const extra = source();
  extra.collections[0].items[0].metadata.outcome = "Plaintiff won";
  assert.throws(() => validateCmsInventory(extra), /Unapproved CMS metadata/);
});
test("reject tampered official links", () => {
  const forged = source();
  const item = forged.collections[0].items.find((i) => i.metadata.officialCaseUrl);
  assert.ok(item, "Expected official court sources in CMS snapshot");
  item.metadata.officialCaseUrl = "https://sudrf.ru.evil.example/case/12";
  assert.throws(() => validateCmsInventory(forged), /Untrusted CMS source URL/);
});
test("reject duplicate CMS source IDs and slugs", () => {
  const forged = source();
  forged.collections[0].items[1].id = forged.collections[0].items[0].id;
  assert.throws(() => validateCmsInventory(forged), /Duplicate CMS source/);
});
