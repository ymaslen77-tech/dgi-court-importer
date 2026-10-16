import {test} from "node:test";
import assert from "node:assert/strict";
import {validateStagingConfig} from "../lib/staging-config.mjs";
const safe=()=>({
 SITE_CUTOVER:"false",SITE_RELEASE_APPROVED:"no",CMS_PUBLIC_READS:"false",
 COURT_DB_READS:"false",
 CMS_DATABASE_URL:"postgresql://editor:secret-unique@cms-db:5432/dgi_cms",
 DATABASE_URL:"postgresql://site:secret-distinct@site-db:5432/dgi_site",
 PAYLOAD_SECRET:"unique-staging-secret-of-more-than-32-characters",
 CMS_POSTGRES_PASSWORD:"independent-cms-password-very-long",
 POSTGRES_PASSWORD:"independent-site-password-very-long",
});
test("staging configuration can pass without exposing credential values",()=>{
 assert.equal(validateStagingConfig(safe()).ok,true);
});
test("a shared CMS/site PostgreSQL database is rejected",()=>{
 const e=safe(); e.CMS_DATABASE_URL=e.DATABASE_URL;
 const r=validateStagingConfig(e);
 assert.equal(r.ok,false);
 assert.ok(r.issues.some(v=>v.id==="sharedDatabase"));
 assert.ok(!JSON.stringify(r).includes("secret-distinct"));
});
test("release flags and weak secrets are rejected",()=>{
 const e=safe();e.SITE_CUTOVER="true";e.SITE_RELEASE_APPROVED="yes";
 e.PAYLOAD_SECRET="replace-placeholder";e.CMS_POSTGRES_PASSWORD="short";
 const r=validateStagingConfig(e);
 for(const key of ["cutover","release","cmsSecret","cmsPassword"])
  assert.ok(r.issues.some(v=>v.id===key),key);
});
test("staging starts without public read access",()=>{
 const e=safe();e.CMS_PUBLIC_READS="true";e.COURT_DB_READS="true";
 const r=validateStagingConfig(e);
 assert.ok(r.issues.some(v=>v.id==="cmsReads"));
 assert.ok(r.issues.some(v=>v.id==="courtReads"));
});
