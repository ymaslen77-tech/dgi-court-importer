#!/usr/bin/env bash
# Restores into disposable DBs, never into source databases.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${STAGING_ENV_FILE:-$ROOT/deploy/staging/.env}"
: "${AGE_IDENTITY_FILE:?Set AGE_IDENTITY_FILE to age private identity file on staging host}"
test "$#" -eq 2 || { echo "Usage: restore-check.sh SITE.dump.age CMS.dump.age" >&2; exit 2; }
test -f "$ENV_FILE" && test -f "$AGE_IDENTITY_FILE"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$ROOT/deploy/staging/compose.yml")
for spec in "site-db:housing:$1" "cms-db:housing_cms:$2"; do
  IFS=: read -r service dbuser archive <<< "$spec"
  test -f "$archive"
  temporary="restore_check_${RANDOM}_${RANDOM}"
  cleanup(){ "${COMPOSE[@]}" exec -T "$service" dropdb --if-exists -U "$dbuser" "$temporary" >/dev/null || true; }
  trap cleanup EXIT
  "${COMPOSE[@]}" exec -T "$service" createdb -U "$dbuser" -T template0 "$temporary"
  age -d -i "$AGE_IDENTITY_FILE" "$archive" |
    "${COMPOSE[@]}" exec -T "$service" pg_restore --exit-on-error --no-owner --no-acl -U "$dbuser" -d "$temporary"
  if [[ "$service" == "site-db" ]]; then
    "${COMPOSE[@]}" exec -T "$service" psql -X -v ON_ERROR_STOP=1 -U "$dbuser" -d "$temporary" -Atqc "SELECT count(*) FROM editorial_pages" >/dev/null
  else
    count=$("${COMPOSE[@]}" exec -T "$service" psql -X -v ON_ERROR_STOP=1 -U "$dbuser" -d "$temporary" -Atqc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
    test "$count" -gt 0
  fi
  cleanup
  trap - EXIT
  echo "$service disposable restore verified"
done
