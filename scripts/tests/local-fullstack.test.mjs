import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const src=readFileSync(new URL("../local-fullstack.ps1",import.meta.url),"utf8");
test("Windows full-stack launcher is fail-closed",()=>{
  for(const flag of ["SITE_CUTOVER","SITE_RELEASE_APPROVED","CMS_PUBLIC_READS","COURT_DB_READS"])
    assert.match(src,new RegExp("\\$env:"+flag+"="));
  assert.match(src,/SITE_CUTOVER="false"/);
  assert.match(src,/SITE_RELEASE_APPROVED="no"/);
  assert.match(src,/CMS_PUBLIC_READS="false"/);
  assert.match(src,/COURT_DB_READS="false"/);
  assert.match(src,/127\.0\.0\.1:5434\/housing/);
  assert.match(src,/127\.0\.0\.1:5435\/housing_cms/);
  assert.match(src,/--hostname","127\.0\.0\.1"/);
  assert.match(src,/CMS_FULL_CONTENT_CONFIRM="yes"/);
  assert.match(src,/cms-private:dry-run/);
});
test("Windows full-stack never enables implicit Webflow/CMS publication",()=>{
  assert.doesNotMatch(src,/\bSITE_CUTOVER="true"/);
  assert.doesNotMatch(src,/\bCMS_PUBLIC_READS="true"/);
  assert.doesNotMatch(src,/\bCOURT_DB_READS="true"/);
  assert.match(src,/import:webflow:apply/);
  assert.match(src,/import:cms-metadata:apply/);
});
