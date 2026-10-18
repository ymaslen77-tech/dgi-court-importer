# Stage 5A — PostgreSQL court metadata preview

The court catalog page can now load its entries from the structured tables
`court_cases`, `court_instances`, and `court_sources` produced by the
existing safe import. Enable only in isolated staging using:
```
COURT_DB_READS=true
DATABASE_URL=postgresql://.../housing
```
Without the flag, the earlier JSON/JSONL snapshots are unchanged. When enabled,
database errors fail closed rather than silently reverting to a stale index.
The database query is read-only and does not fetch documents from external courts.

Safety rules:
- Provenance is derived from `official:` / `webflow:` stable-key prefixes.
- Webflow items are labeled secondary-source archives; official items are
  metadata-only candidates. **No judicial outcome is asserted.**
- External court URLs require HTTPS and a supported official court host.
- SQL restricts statuses and sorts deterministically.
- For safety the preview is limited to 3,000 rows and fails if larger;
  **server-side pagination and full-text indexes are required before
  scaling to hundreds of thousands of cases**.
- The public Webflow site and `main` remain untouched.
