#!/usr/bin/env bash
#
# Deploy Buffr (Next.js) to Vercel (pay.buffr.ai / app.buffr.ai).
# Syncs env from buffr/.env.local so DATABASE_URL, KETCHUP_SMARTPAY_API_KEY, etc. take effect, then deploys.
# Usage: from repo root (ketchup-smartpay): ./scripts/deploy-buffr.sh [--no-sync]
#   --no-sync  Skip syncing .env.local to Vercel (use existing Vercel env only).
#
# Vercel project: buffr-host (set Root Directory to "buffr" in project settings if needed).
#

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$REPO_ROOT/buffr/.env.local"

cd "$REPO_ROOT"

if ! command -v vercel &>/dev/null; then
  echo "error: vercel CLI not found. Install with: npm i -g vercel"
  exit 1
fi

# Link to Buffr project (buffr-host; use --project buffr if you created a project named buffr)
echo "Linking to Vercel project buffr-host..."
vercel link --project buffr-host --yes

SYNC_ENV=true
[[ "${1:-}" == "--no-sync" ]] && SYNC_ENV=false

if [[ "$SYNC_ENV" == true && -f "$ENV_FILE" ]]; then
  echo "Syncing env from buffr/.env.local to Vercel (production)..."
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
  echo "Env sync done (DATABASE_URL, KETCHUP_SMARTPAY_*, JWT_*, etc.)."
else
  if [[ "$SYNC_ENV" == true && ! -f "$ENV_FILE" ]]; then
    echo "No buffr/.env.local found; using existing Vercel env."
  fi
fi

echo "Deploying Buffr to production..."
vercel --prod --yes

echo "Done. Buffr should be live at your configured domain (e.g. https://pay.buffr.ai)."
