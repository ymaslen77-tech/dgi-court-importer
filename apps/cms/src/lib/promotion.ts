// The ONLY approved content format allowed into the public site's SQL projection.
export type ApprovedPage = {
  slug: string; kind: "landing" | "guide" | "news" | "normative";
  title: string; seoTitle: string; seoDescription: string;
  blocks: Array<{kind:string;text:string;href?:string}>;
  sourceUrl: string | null; checkedAt: string; reviewedBy: string;
};
const kinds = new Set(["landing","guide","news","normative","situation"]);
const blockKinds = new Set(["h1","h2","h3","h4","p","link"]);
function safeHttps(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw || raw.length > 1900) return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || u.username || u.password || u.port && u.port !== "443")
      return null;
    u.hash = "";
    return u.toString();
  } catch { return null; }
}
export function normalizeApprovedPage(input: unknown): ApprovedPage {
  if (!input || typeof input !== "object") throw new Error("Invalid CMS document");
  const p = input as Record<string, unknown>;
  if (p._status !== "published" || p.reviewState !== "approved" ||
      !kinds.has(String(p.kind))) throw new Error("CMS document was not approved and published");
  if (typeof p.slug !== "string" || !/^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(p.slug))
    throw new Error("Invalid CMS slug");
  for (const prop of ["title","seoTitle"] as const) {
    if (typeof p[prop] !== "string" || !p[prop].trim() || p[prop].length > 300)
      throw new Error("Missing SEO/title");
  }
  const reviewedAt = typeof p.reviewedAt === "string" ? p.reviewedAt : "";
  const reviewedBy = p.reviewedBy === null || p.reviewedBy === undefined ? "" : String(p.reviewedBy);
  if (!reviewedBy.trim() || !reviewedAt || !Number.isFinite(Date.parse(reviewedAt)) ||
      Date.parse(reviewedAt) > Date.now()) throw new Error("Missing reviewer audit");
  if (!Array.isArray(p.blocks) || !p.blocks.length || p.blocks.length > 500)
    throw new Error("Invalid content block count");
  const blocks = p.blocks.map((item:unknown) => {
    if (!item || typeof item !== "object") throw new Error("Invalid block");
    const b = item as Record<string,unknown>;
    if (typeof b.kind !== "string" || !blockKinds.has(b.kind) ||
        typeof b.text !== "string" || !b.text.trim() || b.text.length > 10000)
      throw new Error("Invalid block content");
    if (b.kind === "link") {
      const href = b.href;
      if (typeof href !== "string" || !(
        href.startsWith("/") && !href.startsWith("//") ||
        safeHttps(href) !== null
      )) throw new Error("Unsafe link");
      return {kind:b.kind,text:b.text,href};
    }
    return {kind:b.kind,text:b.text};
  });
  const sources = Array.isArray(p.sourceUrls) ? p.sourceUrls : [];
  const firstSource = sources.length && sources[0] && typeof sources[0] === "object" ?
    (sources[0] as Record<string,unknown>).url : null;
  if (firstSource != null && !safeHttps(firstSource)) throw new Error("Invalid source URL");
  return {
    slug:p.slug === "home" ? "" : p.slug,
    kind:p.kind === "situation" ? "guide" : p.kind as ApprovedPage["kind"],
    title:String(p.title),seoTitle:String(p.seoTitle),
    seoDescription:typeof p.seoDescription === "string" ? p.seoDescription : "",
    blocks,sourceUrl: firstSource ? safeHttps(firstSource) : null,
    checkedAt:new Date(reviewedAt).toISOString(),reviewedBy:`payload-user:${reviewedBy}`,
  };
}
