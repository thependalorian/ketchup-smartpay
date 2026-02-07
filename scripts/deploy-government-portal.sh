#!/usr/bin/env bash
#
# Deploy Government Portal to Vercel (gov.ketchup.cc).
# Syncs env from apps/government-portal/.env.local so env vars take effect, then deploys.
# Restores Vercel link to ketchup-portal when done so default 'vercel' commands target ketchup-portal.
# Usage: from repo root: ./scripts/deploy-government-portal.sh [--no-sync]
#   --no-sync  Skip syncing .env.local to Vercel (use existing Vercel env only).
#

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VERCEL_DIR="$REPO_ROOT/.vercel"
ENV_FILE="$REPO_ROOT/government-portal/.env.local"

# Vercel project IDs (buffr team)
GOV_PROJECT_ID="prj_N1WNHJMWTE7sXqmEXxAIZDZaKWA8"
KETCHUP_PROJECT_ID="prj_Q5CVcnM1KcUTLWvgo1l4oHiDWU0k"
ORG_ID="team_MPOdmWd6KnPpGhXI9UYg2Opo"

cd "$REPO_ROOT"

if ! command -v vercel &>/dev/null; then
  echo "error: vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

# Backup current .vercel link and root vercel.json so we can restore after deploy
BACKUP_PROJECT_JSON=""
BACKUP_REPO_JSON=""
BACKUP_VERCEL_JSON=""
[[ -f "$VERCEL_DIR/project.json" ]] && BACKUP_PROJECT_JSON="$(cat "$VERCEL_DIR/project.json")"
[[ -f "$VERCEL_DIR/repo.json" ]] && BACKUP_REPO_JSON="$(cat "$VERCEL_DIR/repo.json")"
[[ -f "$REPO_ROOT/vercel.json" ]] && BACKUP_VERCEL_JSON="$(cat "$REPO_ROOT/vercel.json")"

cleanup() {
  echo "Restoring root vercel.json and Vercel link to ketchup-portal..."
  if [[ -n "$BACKUP_VERCEL_JSON" ]]; then
    echo "$BACKUP_VERCEL_JSON" > "$REPO_ROOT/vercel.json"
  else
    rm -f "$REPO_ROOT/vercel.json"
  fi
  if [[ -n "$BACKUP_PROJECT_JSON" ]]; then
    echo "$BACKUP_PROJECT_JSON" > "$VERCEL_DIR/project.json"
  fi
  if [[ -n "$BACKUP_REPO_JSON" ]]; then
    echo "$BACKUP_REPO_JSON" > "$VERCEL_DIR/repo.json"
  else
    vercel link --project ketchup-portal --yes
  fi
}
trap cleanup EXIT

# Point .vercel at government-portal so 'vercel --prod -A vercel.gov.json' deploys there
mkdir -p "$VERCEL_DIR"
echo "{\"projectId\":\"$GOV_PROJECT_ID\",\"orgId\":\"$ORG_ID\",\"projectName\":\"government-portal\"}" > "$VERCEL_DIR/project.json"
echo "{\"orgId\":\"$ORG_ID\",\"remoteName\":\"origin\",\"projects\":[{\"id\":\"$GOV_PROJECT_ID\",\"name\":\"government-portal\",\"directory\":\".\"}]}" > "$VERCEL_DIR/repo.json"

SYNC_ENV=true
[[ "${1:-}" == "--no-sync" ]] && SYNC_ENV=false

if [[ "$SYNC_ENV" == true && -f "$ENV_FILE" ]]; then
  echo "Syncing env from apps/government-portal/.env.local to Vercel (production)..."
  while IFS= read -r line; do
    line="${line%%#*}"
    line="${line#"${line%%[![:space:]]*}"}"
    [[ -z "$line" ]] && continue
    if [[ "$line" == *=* ]]; then
      key="${line%%=*}"
      key="${key%"${key##*[![:space:]]}"}"
      value="${line#*=}"
      value="${value#\"}"; value="${value%\"}"
      value="${value#\'}"; value="${value%\'}"
      [[ -z "$key" ]] && continue
      if printf '%s' "$value" | vercel env add "$key" production --force 2>/dev/null; then
        echo "  set $key"
      fi
    fi
  done < "$ENV_FILE"
  echo "Env sync done."
else
  if [[ "$SYNC_ENV" == true && ! -f "$ENV_FILE" ]]; then
    echo "No government-portal/.env.local found; using existing Vercel env."
  fi
fi

# Use government-portal build config as root vercel.json so Vercel builds the right app
cp "$REPO_ROOT/vercel.gov.json" "$REPO_ROOT/vercel.json"
echo "Deploying Government Portal to production..."
vercel --prod --yes

echo "Done. Government Portal should be live at https://gov.ketchup.cc"
