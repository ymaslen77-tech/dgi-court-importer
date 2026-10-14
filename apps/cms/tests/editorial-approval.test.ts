import { test } from "node:test";
import assert from "node:assert/strict";
import { assertPreviouslyApprovedForPublication } from "../src/lib/editorial-approval";

const previous = () => ({
  reviewState: "approved", reviewedBy: "41",
  reviewedAt: "2026-10-13T18:00:00.000Z",
});
test("unchanged, previously approved content may be published", () => {
  assert.doesNotThrow(() => assertPreviouslyApprovedForPublication(
    {reviewState:"approved"},previous(),false));
});
test("explicit revocation cannot be bypassed with a previous approval", () => {
  assert.throws(() => assertPreviouslyApprovedForPublication(
    {reviewState:"needs-review"},previous(),false));
});
test("new approval and substantive edits are not publishable in the same update", () => {
  assert.throws(() => assertPreviouslyApprovedForPublication(
    {reviewState:"approved"},{reviewState:"needs-review"},false));
  assert.throws(() => assertPreviouslyApprovedForPublication(
    {reviewState:"approved"},previous(),true));
});
test("approval identities and timestamps must be retained", () => {
  assert.throws(() => assertPreviouslyApprovedForPublication(
    {reviewedBy:null},previous(),false));
  assert.throws(() => assertPreviouslyApprovedForPublication(
    {reviewedAt:null},previous(),false));
  assert.throws(() => assertPreviouslyApprovedForPublication(
    {},{...previous(),reviewedAt:"invalid"},false));
  assert.throws(() => assertPreviouslyApprovedForPublication(
    {},{...previous(),reviewedAt:"2099-01-01T00:00:00.000Z"},false));
});
