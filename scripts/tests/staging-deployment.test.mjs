import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(p)=>readFileSync(new URL(p,import.meta.url),"utf8");
test("independent staging stack is loopback-only with separate persistent databases",()=>{
 const compose=read("../../deploy/staging/compose.yml");
 assert.match(compose,/127\.0\.0\.1:\$\{STAGING_WEB_PORT/);
 assert.match(compose,/127\.0\.0\.1:\$\{STAGING_CMS_PORT/);
 assert.match(compose,/site_pgdata: \{\}/);
 assert.match(compose,/cms_pgdata: \{\}/);
 assert.match(compose,/cms_uploads: \{\}/);
 assert.match(compose,/site-private: \{internal: true\}/);
 assert.match(compose,/cms-private: \{internal: true\}/);
 assert.match(compose,/SITE_CUTOVER: "false"/);
 assert.match(compose,/SITE_RELEASE_APPROVED: "no"/);
 assert.match(compose,/CMS_PUBLIC_READS: "false"/);
 assert.match(compose,/COURT_DB_READS: "false"/);
 assert.doesNotMatch(compose,/\b0\.0\.0\.0:/);
});
test("staging backups are encrypted and restoration is disposable",()=>{
 const backup=read("../../deploy/staging/backup.sh");
 const restore=read("../../deploy/staging/restore-check.sh");
 assert.match(backup,/age -r "\$AGE_RECIPIENT" -o "\$tmp"/);
 assert.match(restore,/pg_restore --exit-on-error/);
 assert.match(restore,/dropdb --if-exists/);
 assert.match(restore,/createdb .* -T template0/);
});
