// Smoke test run only on disposable CI CMS databases.
import { getPayload } from "payload";
import config from "../payload.config";

if (process.env.NODE_ENV !== "development" ||
    !process.env.CMS_DATABASE_URL?.includes("housing_cms_ci"))
  throw new Error("Refusing to inspect anything outside disposable CMS CI database");
const payload = await getPayload({ config });
const admins = await payload.find({collection:"staff-users",overrideAccess:true,limit:10});
if (admins.totalDocs !== 1 || admins.docs[0]?.role !== "admin")
  throw new Error("Offline administrator bootstrap failed");
const entries = await payload.find({
  collection:"editorial-entries",overrideAccess:true,draft:true,limit:100,depth:0,
});
if (entries.totalDocs !== 78) throw new Error(`Expected 78 unique draft pages, got ${entries.totalDocs}`);
for (const doc of entries.docs) {
  if (doc._status !== "draft" || doc.reviewState !== "needs-review" ||
      doc.reviewedAt || doc.reviewedBy)
    throw new Error(`Invalid imported publication state: ${doc.slug}`);
}

const sourceArchive=await payload.find({
  collection:"webflow-cms-review",overrideAccess:true,limit:100,depth:0,
});
if(sourceArchive.totalDocs!==50)throw new Error(`Expected 50 private CMS source records, got ${sourceArchive.totalDocs}`);
for(const doc of sourceArchive.docs) {
  if(doc.reconciliationStatus!=="pending" || doc.sourceKey.length<25)
    throw new Error("Source archive must remain unapproved");
}
console.log(JSON.stringify({admin:1,drafts:33,cmsSourceRecords:50,approvals:0,publications:0}));
process.exit(0);
