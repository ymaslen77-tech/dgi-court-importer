// Read-only adapter. Webflow imports remain in review and are NEVER exposed here.
import { cache } from "react";
import pg, { type Pool as PgPool } from "pg";
import type { MigratedBlock, MigratedPage } from "./pages";

type DbPage = {
  slug: string;
  title: string;
  seo_title: string;
  seo_description: string;
  source_url: string | null;
  body: unknown;
};

const kinds = new Set(["h1", "h2", "h3", "h4", "p", "link"]);
let pool: PgPool | undefined;

function dbPool(): PgPool {
  if (!process.env.DATABASE_URL) {
    throw new Error("CMS_PUBLIC_READS requires DATABASE_URL");
  }
  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
    query_timeout: 5000,
    statement_timeout: 5000,
  });
  return pool;
}

function safeBlocks(input: unknown): MigratedBlock[] | undefined {
  if (!Array.isArray(input) || !input.length || input.length > 500) return undefined;
  const result: MigratedBlock[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return undefined;
    const block = item as Record<string, unknown>;
    if (typeof block.kind !== "string" || !kinds.has(block.kind) ||
        typeof block.text !== "string" || !block.text.trim() || block.text.length > 10000) {
      return undefined;
    }
    if (block.kind === "link") {
      const href = block.href;
      if (typeof href !== "string" || !(
        (href.startsWith("/") && !href.startsWith("//")) || href.startsWith("https://")
      )) return undefined;
      result.push({ kind: "link", text: block.text, href });
    } else {
      if (block.href !== undefined && block.href !== null) return undefined;
      result.push({ kind: block.kind as MigratedBlock["kind"], text: block.text });
    }
  }
  return result;
}

function parsePage(row: DbPage): MigratedPage {
  const blocks = safeBlocks(row.body);
  if (!blocks || !row.title?.trim() || !row.seo_title?.trim() ||
      (row.slug !== "" && !/^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(row.slug))) {
    throw new Error("Published editorial page failed public-data validation");
  }
  const source = row.source_url?.startsWith("https://")
    ? row.source_url
    : new URL("/" + row.slug, "https://dgimos.webflow.io").toString();
  return {
    slug: row.slug,
    title: row.title,
    seoTitle: row.seo_title,
    description: row.seo_description || "",
    source,
    blocks,
  };
}

// Both the SQL predicate and the database CHECK constraint are mandatory.
// This is deliberately opt-in until editorial roles and Payload are integrated.
export const getPublishedEditorialPage = cache(async (
  slug: string,
): Promise<MigratedPage | undefined> => {
  if (process.env.CMS_PUBLIC_READS !== "true") return undefined;
  if (slug !== "" && !/^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(slug)) return undefined;
  const result = await dbPool().query<DbPage>(
    `SELECT slug,title,seo_title,seo_description,body,source_url
       FROM editorial_pages
      WHERE slug = $1
        AND editorial_status = 'published'
        AND checked_at IS NOT NULL
        AND reviewed_by IS NOT NULL
        AND btrim(reviewed_by) <> ''
        AND published_at IS NOT NULL
        AND published_at <= now()
      LIMIT 1`,
    [slug],
  );
  return result.rows[0] ? parsePage(result.rows[0]) : undefined;
});

export async function listPublishedEditorialSlugs(): Promise<string[]> {
  if (process.env.CMS_PUBLIC_READS !== "true") return [];
  const result = await dbPool().query<{ slug: string }>(`
    SELECT slug FROM editorial_pages
     WHERE editorial_status = 'published'
       AND checked_at IS NOT NULL
       AND reviewed_by IS NOT NULL
       AND btrim(reviewed_by) <> ''
       AND published_at IS NOT NULL
       AND published_at <= now()
     ORDER BY slug LIMIT 50001
  `);
  if (result.rows.length > 50000) {
    throw new Error("Published sitemap exceeds 50,000 entries; implement sitemap partitioning");
  }
  return result.rows.map(row => row.slug).filter(slug => slug === "" || /^[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(slug));
}
