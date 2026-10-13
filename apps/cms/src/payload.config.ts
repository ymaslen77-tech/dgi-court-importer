import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildConfig } from "payload";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { Users } from "./collections/Users";
import { EditorialEntries } from "./collections/EditorialEntries";
import { CourtReferences } from "./collections/CourtReferences";
import { Media } from "./collections/Media";
import { WebflowCmsReview } from "./collections/WebflowCmsReview";

const here = path.dirname(fileURLToPath(import.meta.url));
export default buildConfig({
  admin: { user: Users.slug, importMap: { baseDir: here } },
  collections: [Users, EditorialEntries, CourtReferences, Media, WebflowCmsReview],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  db: postgresAdapter({pool:{connectionString:process.env.CMS_DATABASE_URL || ""}}),
  typescript: {outputFile:path.resolve(here,"payload-types.ts")},
  // Never enable public REST reads for drafts or court records by default.
});
