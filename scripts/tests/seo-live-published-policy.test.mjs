import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const read = path => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

test("production audit rejects noindex and empty sitemap rather than requiring beta gates",()=>{
  const live=read("scripts/seo-live-audit.mjs");
  const smoke=read("scripts/production-http-smoke.mjs");
  for(const rule of ["unexpected_noindex","whole_site_disallow","empty_sitemap",
    "published_url_missing","preview_or_unknown_route_exposed","published_pdf_missing_noindex"]){
    assert.ok(live.includes(rule), "Published SEO audit missing " + rule);
  }
  assert.doesNotMatch(live,/unreviewed_beta_missing_noindex|unapproved_beta_sitemap_leaks_urls/);
  assert.match(smoke,/import "\.\/seo-live-audit\.mjs"/);
  assert.doesNotMatch(smoke,/robots must block indexing|unreviewed release must have empty sitemap/);
});

test("scheduled production audits check protected source SHA not obsolete default branch code",()=>{
  for(const workflow of [".github/workflows/seo-live-audit.yml",
    ".github/workflows/production-http-smoke.yml"]) {
    const config=read(workflow);
    assert.match(config,/infra\/coolify-russian-vps/);
    assert.match(config,/github\.event_name == 'pull_request'/);
    assert.match(config,/SEO_AUDITED_SHA/);
    assert.match(config,/actions\/upload-artifact@v4/);
  }
});

test("cross-browser CI uses independent projects and does not remove Chromium staging guard",()=>{
  const config=read("apps/web/playwright.config.ts");
  const workflow=read(".github/workflows/browser-staging-qa.yml");
  assert.match(config,/desktop-chromium/);
  assert.match(config,/mobile-chromium/);
  assert.match(config,/desktop-firefox/);
  assert.match(config,/desktop-webkit/);
  assert.match(workflow,/cross-browser:/);
  assert.match(workflow,/install --with-deps firefox webkit/);
  assert.match(workflow,/--project=desktop-chromium --project=mobile-chromium/);
  assert.match(workflow,/--project=desktop-firefox --project=desktop-webkit/);
  assert.doesNotMatch(workflow,/SITE_CUTOVER: "true"/);
});
