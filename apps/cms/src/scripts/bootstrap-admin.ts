// One-shot bootstrap. Run from a trusted, private terminal against an empty CMS DB.
import { getPayload } from "payload";
import config from "../payload.config";

const email = process.env.CMS_BOOTSTRAP_EMAIL?.trim();
const password = process.env.CMS_BOOTSTRAP_PASSWORD;
if (process.env.CMS_BOOTSTRAP_CONFIRM !== "yes" ||
    !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ||
    !password || password.length < 16 ||
    !process.env.CMS_DATABASE_URL || !process.env.PAYLOAD_SECRET ||
    process.env.PAYLOAD_SECRET.length < 32) {
  throw new Error("Offline bootstrap requires confirmation, email, password >=16 chars, CMS_DATABASE_URL and PAYLOAD_SECRET >=32 chars");
}
const payload = await getPayload({ config });
const existing = await payload.count({ collection: "staff-users", overrideAccess: true });
if (existing.totalDocs !== 0) throw new Error("Staff users already exist; refuse bootstrap");
await payload.create({collection:"staff-users", overrideAccess:true, data:{
  email, password, displayName:"Primary administrator", role:"admin",
}});
console.log("Initial administrator created; unset CMS_BOOTSTRAP_PASSWORD immediately.");
process.exit(0);
