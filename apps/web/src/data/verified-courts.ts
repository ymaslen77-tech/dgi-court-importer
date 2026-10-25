import "server-only";
import pg, { type Pool as PgPool } from "pg";

type Row = {
  slug: string;
  case_number: string;
  court_name: string;
  decision_date: string;
  act_type: string;
  topic: string;
  official_url: string;
  official_pdf_url: string;
  pdf_sha256: string;
  excerpt: string;
};

export type VerifiedCase = Row;
const verifiedQueryMaxLength = 100;
let pool: PgPool | undefined;

export function verifiedCourtReadsEnabled(): boolean {
  return process.env.COURT_VERIFIED_PUBLIC_READS === "true" &&
    Boolean(process.env.DATABASE_URL);
}
function db(): PgPool {
  if (!verifiedCourtReadsEnabled()) throw new Error("Verified court catalogue is unavailable");
  pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4, connectionTimeoutMillis: 5000, query_timeout: 7000,
    statement_timeout: 7000, idleTimeoutMillis: 10000,
  });
  return pool;
}
const officialHosts = ["mos-gorsud.ru", "sudrf.ru", "vsrf.ru"];
export function isOfficialCourtUrl(value: string): boolean {
  if (!value || value.length > 1900) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password &&
      (!u.port || u.port === "443") &&
      officialHosts.some((host) => u.hostname.toLowerCase() === host ||
        u.hostname.toLowerCase().endsWith("." + host));
  } catch { return false; }
}
export function validVerifiedSearch(term: string): string {
  const normalized = term.trim().normalize("NFC");
  if (normalized.length > verifiedQueryMaxLength ||
    /[\x00-\x1f\x7f]/.test(normalized)) throw new RangeError("Некорректный поисковый запрос");
  return normalized;
}

const publicConditions = `
  d.status='published'
  AND d.source_checked_at IS NOT NULL
  AND d.text_verified_at IS NOT NULL
  AND d.privacy_checked_at IS NOT NULL
  AND d.reviewed_by IS NOT NULL AND length(btrim(d.reviewed_by))>=3
  AND d.published_at IS NOT NULL AND d.published_at<=now()
  AND p.approved_at IS NOT NULL
  AND p.source_checked_at IS NOT NULL AND p.privacy_checked_at IS NOT NULL
  AND p.approved_by IS NOT NULL AND length(btrim(p.approved_by))>=3
`;

export async function searchVerifiedCourtActs(q: string): Promise<VerifiedCase[]> {
  if (!verifiedCourtReadsEnabled()) return [];
  const term = validVerifiedSearch(q);
  const escaped = "%" + term.replace(/[\\%_]/g, "\\$&") + "%";
  const { rows } = await db().query<Row>(`
  SELECT d.slug, d.case_number, d.court_name, d.decision_date::text,
         d.act_type, d.topic, d.official_url, p.official_pdf_url,
         p.pdf_sha256,
         CASE WHEN $1::text='' THEN left(d.topic,200)
              WHEN to_tsvector('russian', d.full_text) @@ plainto_tsquery('russian',$1)
              THEN ts_headline('russian',d.full_text,plainto_tsquery('russian',$1),
                'MaxWords=22,MinWords=8,MaxFragments=1,StartSel=,StopSel=')
              ELSE left(d.topic,200) END AS excerpt
    FROM court_act_documents d
    INNER JOIN court_act_pdf_assets p ON p.court_act_document_id=d.id
   WHERE ${publicConditions}
     AND ($1::text='' OR
       to_tsvector('russian', d.full_text) @@ plainto_tsquery('russian',$1) OR
       d.case_number ILIKE $2 ESCAPE '\\' OR
       d.court_name ILIKE $2 ESCAPE '\\' OR
       d.topic ILIKE $2 ESCAPE '\\')
   ORDER BY d.decision_date DESC, d.slug
   LIMIT 40
  `, [term, escaped]);
  return rows.filter((row) =>
    /^[a-z0-9][a-z0-9-]{2,159}$/.test(row.slug) &&
    /^[a-f0-9]{64}$/.test(row.pdf_sha256) &&
    isOfficialCourtUrl(row.official_url) &&
    isOfficialCourtUrl(row.official_pdf_url)
  );
}

export type VerifiedPdf = {
  bytes: Buffer; sha256: string; officialPdfUrl: string;
};
export async function readVerifiedCourtPdf(slug: string): Promise<VerifiedPdf | null> {
  if (!verifiedCourtReadsEnabled() ||
    !/^[a-z0-9][a-z0-9-]{2,159}$/.test(slug)) return null;
  const { rows } = await db().query<{
    pdf_bytes: Buffer; pdf_sha256: string; official_pdf_url: string;
    official_url: string;
  }>(`
    SELECT p.pdf_bytes,p.pdf_sha256,p.official_pdf_url,d.official_url
      FROM court_act_documents d
      JOIN court_act_pdf_assets p ON p.court_act_document_id=d.id
     WHERE d.slug=$1 AND ${publicConditions} LIMIT 1
  `, [slug]);
  const pdf = rows[0];
  if (!pdf || !isOfficialCourtUrl(pdf.official_pdf_url) ||
    !isOfficialCourtUrl(pdf.official_url) ||
    !Buffer.isBuffer(pdf.pdf_bytes)) return null;
  return {
    bytes: pdf.pdf_bytes,
    sha256: pdf.pdf_sha256,
    officialPdfUrl: pdf.official_pdf_url,
  };
}
