// Idempotent import of previously public Webflow page snapshots as UNAPPROVED drafts.
import { readFileSync } from "node:fs";

type BlockKind = "h1" | "h2" | "h3" | "h4" | "p" | "link";
type SourcePage = {
  slug: string; title: string; seoTitle: string; description: string;
  source: string; blocks: Array<{ kind: BlockKind; text: string; href?: string }>;
};
const validKinds = new Set(["h1","h2","h3","h4","p","link"]);
const pages: SourcePage[] = [];
for (let batch=0;batch<6;batch++) {
  const url = new URL(`../../../web/src/data/pages-${batch}.json`, import.meta.url);
  const data: unknown = JSON.parse(readFileSync(url, "utf8"));
  if (!Array.isArray(data)) throw new Error("Invalid snapshot batch");
  pages.push(...data as SourcePage[]);
}
if (pages.length !== 33) throw new Error(`Expected 33 published Webflow pages, got ${pages.length}`);
const mappedSlugs = pages.map(page => page.slug === "" ? "home" : page.slug);
if (new Set(mappedSlugs).size !== pages.length) throw new Error("Duplicate page slug");
for (const page of pages) {
  if (!page.source.startsWith("https://dgimos.webflow.io/") ||
      !page.title?.trim() || !page.seoTitle?.trim() ||
      !page.blocks?.length || page.blocks.length > 500 ||
      !page.blocks.every(b => validKinds.has(b.kind) && typeof b.text === "string" &&
        b.text.trim() && b.text.length <= 10000 &&
        (b.kind !== "link" || typeof b.href === "string" && (
          b.href.startsWith("https://") || b.href.startsWith("/") && !b.href.startsWith("//")
        )))) {
    throw new Error(`Invalid public snapshot: ${page.slug}`);
  }
}
const mode = process.argv[2] || "--dry-run";
if (!["--dry-run","--apply"].includes(mode) || process.argv.length > 3)
  throw new Error("Use --dry-run or --apply");
if (mode !== "--apply") {
  console.log(JSON.stringify({ mode: "dry-run", pages: pages.length, approved: 0, published: 0, writes: 0 }));
  process.exit(0);
}
if (process.env.CMS_PRIVATE_IMPORT !== "yes" || process.env.CMS_IMPORT_CONFIRM !== "yes")
  throw new Error("Refusing write: CMS_PRIVATE_IMPORT and CMS_IMPORT_CONFIRM must both be yes");
if (!process.env.CMS_DATABASE_URL || !process.env.PAYLOAD_SECRET ||
    process.env.PAYLOAD_SECRET.length < 32)
  throw new Error("Private CMS database and strong secret required");
const [{ getPayload }, { default: config }] = await Promise.all([
  import("payload"), import("../payload.config")
]);
const payload = await getPayload({ config });
let created = 0, skipped = 0;
for (const [index, page] of pages.entries()) {
  const slug=mappedSlugs[index];
  const existing=await payload.find({
    collection:"editorial-entries",where:{slug:{equals:slug}},limit:1,depth:0,overrideAccess:true
  });
  if (existing.totalDocs) {skipped++;continue;}
  await payload.create({
    collection:"editorial-entries",
    overrideAccess:true,
    context:{migrationSource:"webflow-public-pages"},
    data:{
      kind: slug==="home" ? "landing" : slug==="novosti-zhilishchnogo-prava" ? "news" : "guide",
      slug, title:page.title, description:page.description,
      seoTitle:page.seoTitle,seoDescription:page.description,
      blocks:page.blocks.map(b=>({kind:b.kind,text:b.text,href:b.href})),
      sourceUrls:[{url:page.source}],
      reviewState:"needs-review",
      _status:"draft",
    },
  });
  created++;
}
console.log(JSON.stringify({mode:"drafts-only",total:pages.length,created,skipped,approved:0,published:0}));
process.exit(0);
