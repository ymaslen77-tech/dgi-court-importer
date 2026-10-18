// Read-only, opt-in PostgreSQL court metadata index. No unverified judicial outcomes.
import pg, { type Pool as PgPool } from "pg";
import type { CourtListing } from "@/components/CourtExplorer";

type CourtRow = {
  stable_key: string;
  case_number: string;
  court_name: string;
  topic: string;
  source_url: string | null;
};
let pool: PgPool | undefined;
const allowedHosts = ["mos-gorsud.ru","sudrf.ru","vsrf.ru","kad.arbitr.ru"];
function safeOfficialUrl(value: string | null): string | undefined {
  if (!value || value.length > 1900) return undefined;
  try {
    const u = new URL(value);
    const host = u.hostname.toLowerCase();
    if (u.protocol !== "https:" || u.username || u.password ||
        (u.port && u.port !== "443") ||
        !allowedHosts.some(domain => host === domain || host.endsWith("." + domain))) {
      return undefined;
    }
    u.hash = "";
    return u.toString();
  } catch { return undefined; }
}
export async function listCourtListingsFromDb(): Promise<CourtListing[] | undefined> {
  if (process.env.COURT_DB_READS !== "true") return undefined;
  if (!process.env.DATABASE_URL) throw new Error("COURT_DB_READS requires DATABASE_URL");
  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4, connectionTimeoutMillis: 5000, idleTimeoutMillis: 10000,
    query_timeout: 5000, statement_timeout: 5000,
  });
  const { rows } = await pool.query<CourtRow>(`
    SELECT cc.stable_key, ci.case_number, ci.court_name, cc.topic, source.source_url
      FROM court_cases cc
      JOIN court_instances ci ON ci.case_id = cc.id
      LEFT JOIN LATERAL (
        SELECT cs.source_url FROM court_sources cs
         WHERE cs.instance_id = ci.id AND cs.source_type = 'court_card'
         ORDER BY cs.checked_at DESC NULLS LAST, cs.created_at DESC
         LIMIT 1
      ) AS source ON true
     WHERE (cc.stable_key LIKE 'official:%' OR cc.stable_key LIKE 'webflow:%')
       AND cc.editorial_status IN ('candidate','review','verified','published')
     ORDER BY cc.stable_key, ci.case_number
     LIMIT 3001
  `);
  if (rows.length > 3000) {
    // Avoid silently presenting an incomplete index as all results.
    throw new Error("Court preview exceeded 3000 entries; paginated search is required");
  }
  return rows.map(row => ({
    id: `db:${row.stable_key}:${row.case_number}`,
    number: row.case_number,
    court: row.court_name,
    category: row.topic || "Категория требует проверки",
    url: safeOfficialUrl(row.source_url),
    source: row.stable_key.startsWith("official:")
      ? "official-candidate" as const : "published-legacy" as const,
  }));
}
