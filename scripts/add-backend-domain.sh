#!/usr/bin/env bash
# Add api.ketchup.cc to ketchup-backend (remove from ketchup-portal if present).
# Requires VERCEL_TOKEN. Create one at https://vercel.com/account/tokens
# Usage: VERCEL_TOKEN=your_token ./scripts/add-backend-domain.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo "VERCEL_TOKEN is required. Create a token at https://vercel.com/account/tokens"
  echo "Then run: VERCEL_TOKEN=your_token ./scripts/add-backend-domain.sh"
  exit 1
fi

node scripts/set-vercel-env-and-domain.mjs --domain-only
