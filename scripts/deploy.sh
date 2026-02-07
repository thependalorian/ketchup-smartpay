#!/usr/bin/env bash
#
# Deploy one of the three Ketchup SmartPay projects from this directory.
# Run from repo root: ./scripts/deploy.sh <backend|ketchup-portal|government-portal>
# See PROJECTS.md for project list and domains.
#

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

usage() {
  echo "Usage: ./scripts/deploy.sh <backend|ketchup-portal|government-portal> [--no-sync]"
  echo ""
  echo "  backend           → Railway backend (api.ketchup.cc)"
  echo "  ketchup-portal    → Vercel Ketchup Portal (app.ketchup.cc)"
  echo "  government-portal → Vercel Government Portal (gov.ketchup.cc)"
  echo ""
  echo "  --no-sync         For portals only: skip syncing .env.local to Vercel"
  echo ""
  echo "See PROJECTS.md for details."
  exit 1
}

TARGET="${1:-}"
if [[ -z "$TARGET" ]]; then
  usage
fi

case "$TARGET" in
  backend)
    exec "$SCRIPT_DIR/deploy-backend.sh"
    ;;
  ketchup-portal)
    exec "$SCRIPT_DIR/deploy-ketchup-portal.sh" "${@:2}"
    ;;
  government-portal)
    exec "$SCRIPT_DIR/deploy-government-portal.sh" "${@:2}"
    ;;
  *)
    echo "Unknown project: $TARGET"
    usage
    ;;
esac
