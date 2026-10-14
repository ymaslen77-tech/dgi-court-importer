# Webflow CMS source queue (50 sanitized metadata records)

The old Webflow site has four collections (37 court cases, 4 normative
documents, 6 legal situations, 3 housing-law news posts). The source archive
was pre-sanitized before committing to Git; **it is not a full-content copy**
and makes no claim about judicial decisions or current legal provisions.

A new private Payload collection `webflow-cms-review` stores the exact
source collection/id, legacy URL slug, safe title, source status and whitelisted
metadata. Staff can review it in the CMS; the website never reads this table,
and the promotion script never selects it.

```sh
pnpm --filter @dgi/cms import:cms-metadata:dry-run
# Only against an explicitly selected isolated CMS database:
CMS_PRIVATE_IMPORT=yes CMS_IMPORT_CONFIRM=yes pnpm --filter @dgi/cms import:cms-metadata:apply
```

Repeated runs skip previously imported records and cannot overwrite later
editorial work. CI on a disposable PostgreSQL instance checks 50 private
records, 33 public-page drafts, **0 approvals, 0 publications**. Legal
analysis, source URLs, original CMS rich-text bodies and case outcomes need
independent editorial/source verification before any new publication.
