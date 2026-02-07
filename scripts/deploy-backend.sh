#!/bin/bash
# Backend is deployed on Railway only (not Vercel).
# See RAILWAY_DEPLOY.md for setup. To deploy: railway up

set -e

echo "Backend is on Railway (not Vercel)."
echo ""
echo "  Deploy:  railway up"
echo "  Status:  railway status"
echo "  Docs:    RAILWAY_DEPLOY.md"
echo ""
if command -v railway >/dev/null 2>&1; then
  railway status 2>/dev/null || true
fi
