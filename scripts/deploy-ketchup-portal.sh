#!/usr/bin/env bash
#
# Deploy Ketchup Portal to Vercel (app.ketchup.cc).
# Syncs env from apps/ketchup-portal/.env.local so env vars take effect, then deploys.
# Usage: from repo root: ./scripts/deploy-ketchup-portal.sh [--no-sync]
#   --no-sync  Skip syncing .env.local to Vercel (use existing Vercel env only).
#

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/apps/ketchup-portal/.env.local"

cd "$REPO_ROOT"

# Ensure Vercel CLI
if ! command -v vercel &>/dev/null; then
  echo "error: vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

# Link to ketchup-portal (idempotent)
echo "Linking to Vercel project ketchup-portal..."
vercel link --project ketchup-portal --yes

SYNC_ENV=true
[[ "${1:-}" == "--no-sync" ]] && SYNC_ENV=false

if [[ "$SYNC_ENV" == true && -f "$ENV_FILE" ]]; then
  echo "Syncing env from apps/ketchup-portal/.env.local to Vercel (production)..."
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
    echo "No apps/ketchup-portal/.env.local found; using existing Vercel env."
  fi
fi

echo "Deploying Ketchup Portal to production..."
vercel --prod --yes

echo "Done. Ketchup Portal should be live at https://app.ketchup.cc"
