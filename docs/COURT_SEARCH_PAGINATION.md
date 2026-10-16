# Court search — indexed, server-side cursor pagination (Stage 6A)

The published Next.js court page remains identical when `COURT_DB_READS=false`.
In a separately tested staging environment, enable `COURT_DB_READS=true` and
point `DATABASE_URL` to a database migrated through `0004_court_search.sql`.

Instead of sending every court row to the browser:
- `GET /api/courts/search?q=<Russian text or case number>&cursor=<opaque>`
  returns at most 24 public **metadata-only** cards and a keyset cursor.
- Query is bounded to 100 Unicode code units and always parameterized.
- Court URLs are allowlisted to official HTTPS court domains.
- Russian full-text indexes and `pg_trgm` indexes speed keyword and case-number
  searches; do not treat a matching card as proof of judicial findings.
- Cards are ordered stably by stable key and court-instance UUID and contain no
  parties, names, judgment texts or asserted case outcomes.
- The route is disabled when DB search is off; all responses use no-store and
  the successful JSON response has noindex headers.

QA: CI installs migration `0004`, checks indexes and tests keyset pagination
against temporary PostgreSQL data. Load-test against real large synthetic data
before increasing concurrency or announcing large-scale readiness. Full
materialized search or OpenSearch remains optional after measured performance.

**No background import, no publication, no production cutover.**
