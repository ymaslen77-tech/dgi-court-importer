import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rootJSON = p => JSON.parse(readFileSync(new URL("../../../" + p, import.meta.url), "utf8"));
const daily = rootJSON("config/dgi-daily-publication.json");
const approval = rootJSON("config/dgi-automation-approval-policy.json");
const queue = rootJSON("research/dgi-court-publication-queue-2026-10-28.json");

test("one daily task covers at most five news and ten source-verified court acts", () => {
  assert.equal(daily.cadence, "daily");
  assert.equal(daily.orchestration.single_scheduled_task, true);
  assert.equal(daily.orchestration.separate_news_or_court_publishing_tasks_enabled, false);
  assert.equal(daily.publication_limits.new_housing_news_per_run, 5);
  assert.equal(daily.publication_limits.new_verified_court_acts_per_run, 10);
  assert.equal(daily.courts.daily_target, 10);
  assert.equal(queue.limit_per_daily_release, 10);
  assert.equal(approval.automatic_courts.daily_verified_target, 10);
});

test("official URLs, full texts, privacy screens and PDF hashes gate court records", () => {
  const steps = daily.courts.discovery_and_import;
  assert.equal(steps.research_and_append_leads_before_trigger, true);
  assert.equal(steps.source_leads_are_not_published_acts, true);
  assert.equal(steps.never_assert_10_of_10_if_fewer_than_10, true);
  assert.equal(steps.reject_only_affected_candidate_on_missing_text_privacy_risk_or_mismatch, true);
  assert.ok(steps.verify_each_added_act.includes("official_full_HTML_text"));
  assert.ok(steps.verify_each_added_act.includes("basic_privacy_screen"));
  assert.ok(steps.verify_each_added_act.includes("PDF_reading_copy_has_label_and_SHA256_matches"));
  assert.ok(steps.verify_each_added_act.includes("full_text_SHA256_matches"));
  assert.equal(steps.accepted_outcome_if_not_proven, "not_classified");
  assert.equal(steps.do_not_automatically_unlock_CMS_or_database_court_read_permissions, true);
});

test("source discovery does not claim news publication or overwrite existing articles", () => {
  assert.equal(daily.news.require_accessible_official_primary_source, true);
  assert.equal(daily.news.discovery_and_editing.discovery_workflow_is_research_only, true);
  assert.equal(daily.news.discovery_and_editing.do_not_overwrite_previously_published_news, true);
  assert.equal(daily.news.discovery_and_editing.only_count_new_unique_records_in_FINAL_PR_HEAD, true);
  assert.equal(daily.news.discovery_and_editing.publication_requires_owner_deploy_and_live_URL_HTTP_200, true);
  assert.equal(queue.auto_publish_from_this_file, false);
});

test("all final-head CI is required before a protected merge and owner manually deploys", () => {
  assert.equal(daily.release.production_branch, "infra/coolify-russian-vps");
  assert.equal(daily.release.prohibit_direct_push_to_production, true);
  assert.equal(daily.release.final_head_CI.only_current_PR_head_SHA_counts, true);
  assert.equal(daily.release.final_head_CI.no_direct_push_to_protected_branch, true);
  assert.deepEqual(daily.release.final_head_CI.required,
    ["web-checks", "db-checks", "cms-checks", "dgi-approval-policy"]);
  assert.equal(daily.release.manual_deployment.execute_Coolify_from_ChatGPT, false);
  assert.equal(daily.release.manual_deployment.published_claims_only_after_live_HTTP_200, true);
  assert.equal(daily.notification.one_daily_summary_for_both_tracks, true);
});
