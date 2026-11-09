#!/usr/bin/env node
// Historic production smoke entrypoint, now sharing the canonical published
// Google/Yandex HTTP policy instead of asserting the retired noindex beta.
import "./seo-live-audit.mjs";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";

mkdirSync("test-results",{recursive:true});
const data=JSON.parse(readFileSync("test-results/seo-live-audit.json","utf8"));
const result={
  checkedAt:data.checkedAt,sourceSha:data.sourceSha,origin:data.origin,
  status:data.errors.length?"failed":"passed",
  sitemapUrlCount:data.sitemapUrlCount,htmlPages:data.auditedHtmlPages,
  errors:data.errors,warnings:data.warnings,
  note:"Public, read-only release audit; does not establish search engine indexing.",
};
writeFileSync("test-results/production-http-smoke.json",JSON.stringify(result,null,2)+"\n");
console.log("DGI PRODUCTION HTTP SMOKE",JSON.stringify({status:result.status,
  pages:result.htmlPages,sitemap:result.sitemapUrlCount,errors:result.errors.length}));
