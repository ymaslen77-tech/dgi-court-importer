import "server-only";
import {cache} from "react";
import pg,{type Pool as PgPool} from "pg";
import {siteIsLive} from "./pages";

export const courtFullTextReadsEnabled =
  siteIsLive && process.env.COURT_FULLTEXT_PUBLIC_READS === "true";
export const courtActBasePath="/sudebnye-akty";

export type PublishedCourtAct = {
 slug:string; case_number:string; uid:string|null; court_name:string;
 instance_type:string; decision_date:string; act_type:string; topic:string;
 full_text:string; full_text_sha256:string; official_url:string;
 seo_title:string; seo_description:string; editor_note:string;
 published_at:string; updated_at:string;
};
export type CourtActSummary=Pick<PublishedCourtAct,
  "slug"|"case_number"|"court_name"|"decision_date"|"act_type"|"topic"|"seo_title"|"seo_description"|"updated_at">;

let pool:PgPool|undefined;
function db():PgPool {
 if(!courtFullTextReadsEnabled) throw new Error("Public court full text reads disabled");
 if(!process.env.DATABASE_URL)throw new Error("Published court acts require DATABASE_URL");
 pool??=new pg.Pool({connectionString:process.env.DATABASE_URL,max:4,
   connectionTimeoutMillis:5000,idleTimeoutMillis:10000,
   query_timeout:6500,statement_timeout:6500});
 return pool;
}
const allow=["mos-gorsud.ru","sudrf.ru","vsrf.ru","kad.arbitr.ru"];
export function isExactOfficialCourtActUrl(value:string):boolean {
 if(value.length>1900)return false;
 try {
  const u=new URL(value);
  if(u.protocol!=="https:"||u.username||u.password||u.port||u.hash)return false;
  const host=u.hostname.toLowerCase();
  if(!allow.some(v=>host===v||host.endsWith("."+v)))return false;
  // General search/listing pages never prove the identity or body of an act.
  if(/\/services\/cases\/(?:appeal-civil|civil|appeal-criminal|criminal|administrative)\/?$/i.test(u.pathname))return false;
  if(host==="kad.arbitr.ru" && u.pathname==="/")return false;
  return true;
 } catch {return false;}
}
function validPublicAct(row:PublishedCourtAct):boolean {
 return /^[a-z0-9][a-z0-9-]{2,159}$/.test(row.slug) &&
    isExactOfficialCourtActUrl(row.official_url) &&
    row.full_text.trim().length>=400 &&
    /^[a-f0-9]{64}$/.test(row.full_text_sha256) &&
    row.seo_title.length>=20 && row.seo_description.length>=60 &&
    row.editor_note.length>=70;
}
export const getPublishedCourtAct=cache(async (slug:string):Promise<PublishedCourtAct|undefined>=>{
 if(!courtFullTextReadsEnabled || !/^[a-z0-9][a-z0-9-]{2,159}$/.test(slug))return undefined;
 const result=await db().query<PublishedCourtAct>(`
   SELECT slug,case_number,uid,court_name,instance_type,
      decision_date::text,act_type,topic,full_text,full_text_sha256,
      official_url,seo_title,seo_description,editor_note,
      published_at::text,updated_at::text
   FROM court_act_documents
   WHERE slug=$1 AND status='published' AND source_checked_at IS NOT NULL
     AND text_verified_at IS NOT NULL AND privacy_checked_at IS NOT NULL
     AND reviewed_by IS NOT NULL AND length(btrim(reviewed_by))>=3
     AND published_at IS NOT NULL AND published_at <= now()
   LIMIT 1`,[slug]);
 const item=result.rows[0];
 if(!item)return undefined;
 if(!validPublicAct(item))throw new Error("Published court act failed public source/content validation");
 return item;
});
export async function listPublishedCourtActSlugs():Promise<Array<{slug:string;updated_at:string}>>{
 if(!courtFullTextReadsEnabled)return [];
 const {rows}=await db().query<{slug:string;updated_at:string}>(`
  SELECT slug,updated_at::text FROM court_act_documents
  WHERE status='published' AND source_checked_at IS NOT NULL
   AND text_verified_at IS NOT NULL AND privacy_checked_at IS NOT NULL
   AND reviewed_by IS NOT NULL AND length(btrim(reviewed_by))>=3
   AND published_at IS NOT NULL AND published_at<=now()
  ORDER BY slug LIMIT 50001`);
 if(rows.length>50000)throw new Error("Published court acts require sitemap partitioning");
 return rows.filter(row=>/^[a-z0-9][a-z0-9-]{2,159}$/.test(row.slug));
}
export async function listPublishedCourtActSummaries(limit=50):Promise<CourtActSummary[]>{
 if(!courtFullTextReadsEnabled)return [];
 const n=Math.max(1,Math.min(100,Math.floor(limit)));
 const {rows}=await db().query<CourtActSummary>(`
 SELECT slug,case_number,court_name,decision_date::text,act_type,topic,
        seo_title,seo_description,updated_at::text
 FROM court_act_documents
 WHERE status='published' AND source_checked_at IS NOT NULL
    AND text_verified_at IS NOT NULL AND privacy_checked_at IS NOT NULL
    AND reviewed_by IS NOT NULL AND length(btrim(reviewed_by))>=3
    AND published_at IS NOT NULL AND published_at<=now()
 ORDER BY decision_date DESC,slug
 LIMIT $1`,[n]);
 return rows.filter(row=>/^[a-z0-9][a-z0-9-]{2,159}$/.test(row.slug));
}

export type PublishedCourtActSearchPage={items:CourtActSummary[];nextCursor:string|null};
export async function searchPublishedCourtActs(q:string,cursor:string|null):Promise<PublishedCourtActSearchPage>{
 if(!courtFullTextReadsEnabled)return {items:[],nextCursor:null};
 const term=q.trim().normalize("NFC");
 if(term.length>100 || /[\\x00-\\x1f\\x7f]/.test(term))throw new RangeError("Invalid court search");
 if(cursor && !/^[a-z0-9][a-z0-9-]{2,159}$/.test(cursor))throw new RangeError("Invalid court cursor");
 const pattern="%"+term.replace(/[\\%_]/g,"\\$&")+"%";
 const {rows}=await db().query<CourtActSummary>(`
 SELECT slug,case_number,court_name,decision_date::text,act_type,topic,
        seo_title,seo_description,updated_at::text
 FROM court_act_documents
 WHERE status='published' AND source_checked_at IS NOT NULL
   AND text_verified_at IS NOT NULL AND privacy_checked_at IS NOT NULL
   AND reviewed_by IS NOT NULL AND length(btrim(reviewed_by))>=3
   AND published_at IS NOT NULL AND published_at<=now()
   AND ($1::text='' OR
        to_tsvector('russian',full_text) @@ plainto_tsquery('russian',$1)
        OR case_number ILIKE $2 ESCAPE '\\'
        OR court_name ILIKE $2 ESCAPE '\\'
        OR topic ILIKE $2 ESCAPE '\\')
   AND ($3::text IS NULL OR slug>$3)
 ORDER BY slug ASC LIMIT 26`,[term,pattern,cursor]);
 const hasMore=rows.length>25,items=rows.slice(0,25);
 return {items,nextCursor:hasMore?items.at(-1)!.slug:null};
}
