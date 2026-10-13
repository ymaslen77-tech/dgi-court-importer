import "server-only";
import pg, { type Pool as PgPool } from "pg";
import type { CourtListing } from "@/components/CourtExplorer";

type Raw = { stable_key:string; instance_id:string; case_number:string;
  court_name:string; topic:string; source_url:string|null };
export type CourtPage = { items:CourtListing[]; nextCursor:string|null };
const acceptedHosts = ["mos-gorsud.ru","sudrf.ru","vsrf.ru","kad.arbitr.ru"];
const keyPattern = /^(official|webflow):[a-zA-Z0-9:_\-.]{1,200}$/;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let pool: PgPool | undefined;
export function parseCourtSearch(q:string|null,cursor:string|null) {
  const query = (q||"").trim().normalize("NFC");
  if (query.length > 100 || /[\x00-\x1f\x7f]/.test(query))
    throw new RangeError("Search term is too long or contains control characters");
  let stableKey:string|null=null,instanceId:string|null=null;
  if (cursor) {
    if (cursor.length>512) throw new RangeError("Invalid cursor");
    try {
      const parsed:unknown=JSON.parse(Buffer.from(cursor,"base64url").toString("utf8"));
      if (!Array.isArray(parsed) || parsed.length!==2 ||
        typeof parsed[0]!=="string" || !keyPattern.test(parsed[0]) ||
        typeof parsed[1]!=="string" || !uuidPattern.test(parsed[1]))
        throw new RangeError("Invalid cursor");
      [stableKey,instanceId]=parsed as [string,string];
    } catch { throw new RangeError("Invalid cursor"); }
  }
  return {query,stableKey,instanceId};
}
export function officialCourtHref(value:string|null):string|undefined {
  if (!value || value.length>1900) return undefined;
  try {
    const uri=new URL(value);
    if (uri.protocol!=="https:" || uri.username || uri.password ||
       (uri.port && uri.port!=="443") ||
       !acceptedHosts.some(host=>uri.hostname.toLowerCase()===host||
        uri.hostname.toLowerCase().endsWith("."+host)))return undefined;
    uri.hash="";
    return uri.toString();
  } catch {return undefined;}
}
export async function searchCourtMetadata(q:string|null,cursor:string|null):Promise<CourtPage> {
  if (process.env.COURT_DB_READS!=="true" || !process.env.DATABASE_URL)
    throw new Error("Court database search is disabled");
  const parsed=parseCourtSearch(q,cursor);
  pool ??= new pg.Pool({ connectionString:process.env.DATABASE_URL,max:6,
    connectionTimeoutMillis:5000,idleTimeoutMillis:10000,
    query_timeout:7000,statement_timeout:7000 });
  const pattern="%"+parsed.query.replace(/[\\%_]/g,"\\$&")+"%";
  const result=await pool.query<Raw>(`
    SELECT cc.stable_key,ci.id AS instance_id,ci.case_number,
           ci.court_name,cc.topic,source.source_url
    FROM court_cases cc
    JOIN court_instances ci ON ci.case_id=cc.id
    LEFT JOIN LATERAL (
      SELECT cs.source_url FROM court_sources cs
      WHERE cs.instance_id=ci.id AND cs.source_type='court_card'
      ORDER BY cs.checked_at DESC NULLS LAST,cs.created_at DESC
      LIMIT 1
    ) source ON true
    WHERE (cc.stable_key LIKE 'official:%' OR cc.stable_key LIKE 'webflow:%')
      AND cc.editorial_status IN ('candidate','review','verified','published')
      AND (
        $1::text='' OR
        ci.case_number ILIKE $2 ESCAPE '\\' OR
        ci.court_name ILIKE $2 ESCAPE '\\' OR
        cc.topic ILIKE $2 ESCAPE '\\' OR
        to_tsvector('russian',cc.topic) @@ plainto_tsquery('russian',$1) OR
        to_tsvector('russian',ci.court_name) @@ plainto_tsquery('russian',$1)
      )
      AND (
        $3::text IS NULL OR cc.stable_key > $3 OR
        (cc.stable_key=$3 AND ci.id > $4::uuid)
      )
    ORDER BY cc.stable_key,ci.id
    LIMIT 25
  `,[parsed.query,pattern,parsed.stableKey,parsed.instanceId]);
  const more=result.rows.length>24;
  const selected=more?result.rows.slice(0,24):result.rows;
  const last=selected.at(-1);
  return {
    items:selected.map(item=>({
      id:`db:${item.stable_key}:${item.instance_id}`,
      number:item.case_number,
      court:item.court_name,
      category:item.topic||"Категория требует проверки",
      url:officialCourtHref(item.source_url),
      source:item.stable_key.startsWith("official:") ?
        "official-candidate" as const:"published-legacy" as const,
    })),
    nextCursor:more&&last?Buffer.from(JSON.stringify([last.stable_key,last.instance_id])).toString("base64url"):null,
  };
}
