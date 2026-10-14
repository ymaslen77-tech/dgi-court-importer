#!/usr/bin/env bash
# Apply to a NEW empty isolated website staging DB only. Never to CMS/production.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${STAGING_ENV_FILE:-$ROOT/deploy/staging/.env}"
: "${STAGING_INIT_CONFIRM:?Set STAGING_INIT_CONFIRM=empty-site-db after checking target}"
test "$STAGING_INIT_CONFIRM" = "empty-site-db"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$ROOT/deploy/staging/compose.yml")
tables=$("${COMPOSE[@]}" exec -T site-db psql -U housing -d housing -Atqc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
test "$tables" = "0" || { echo "Refusing migration: site DB not empty" >&2; exit 1; }
for file in "$ROOT"/db/migrations/000{1,2,3,4}_*.sql; do
  test -f "$file"
  echo "Applying $(basename "$file")"
  "${COMPOSE[@]}" exec -T site-db psql -X -v ON_ERROR_STOP=1 -U housing -d housing < "$file"
done
echo "Site schema created. Content remains private/unverified."
