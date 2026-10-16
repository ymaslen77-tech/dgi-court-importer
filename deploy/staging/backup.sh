#!/usr/bin/env bash
# Streams two PostgreSQL custom-format backups straight into age encryption.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${STAGING_ENV_FILE:-$ROOT/deploy/staging/.env}"
BACKUP_DIR="${STAGING_BACKUP_DIR:-$ROOT/backups/staging}"
: "${AGE_RECIPIENT:?Export AGE_RECIPIENT (age public recipient) on backup host}"
test -f "$ENV_FILE" || { echo "Missing private staging env file" >&2; exit 1; }
command -v age >/dev/null || { echo "Install age encryption on backup host" >&2; exit 1; }
command -v docker >/dev/null || { echo "Install Docker Compose" >&2; exit 1; }
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
COMPOSE=(docker compose --env-file "$ENV_FILE" -f "$ROOT/deploy/staging/compose.yml")
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
for spec in "site-db:housing:housing" "cms-db:housing_cms:housing_cms"; do
  IFS=: read -r service dbuser dbname <<< "$spec"
  target="$BACKUP_DIR/${dbname}_${timestamp}.dump.age"
  tmp="${target}.partial"
  trap 'rm -f "$tmp"' EXIT
  "${COMPOSE[@]}" exec -T "$service" pg_dump -U "$dbuser" -d "$dbname" -Fc --no-owner --no-acl |
    age -r "$AGE_RECIPIENT" -o "$tmp"
  test -s "$tmp"
  chmod 600 "$tmp"
  mv "$tmp" "$target"
  trap - EXIT
  echo "Encrypted backup created: $target"
done
echo "IMPORTANT: Test restores and replicate encrypted backups off-host."
