#!/bin/bash

# Fineract Status Check Script
# 
# Purpose: Check if Fineract is running and ready
# Usage: ./scripts/check-fineract-status.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FINERACT_DIR="$SCRIPT_DIR/../fineract"

cd "$FINERACT_DIR"

echo "🔍 Checking Fineract Status..."
echo "=========================================="
echo ""

# Check if containers are running
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "📋 Container Health:"

# Check database
DB_STATUS=$(docker-compose ps db 2>/dev/null | tail -1 | awk '{print $NF}' || echo "unknown")
if [[ "$DB_STATUS" == *"healthy"* ]]; then
    echo "  ✅ Database: Healthy"
else
    echo "  ⏳ Database: Starting..."
fi

# Check Fineract
FINERACT_STATUS=$(docker-compose ps fineract 2>/dev/null | tail -1 | awk '{print $NF}' || echo "unknown")
if [[ "$FINERACT_STATUS" == *"healthy"* ]]; then
    echo "  ✅ Fineract: Healthy and Ready"
    READY=true
elif [[ "$FINERACT_STATUS" == *"starting"* ]]; then
    echo "  ⏳ Fineract: Starting (this takes 2-5 minutes)"
    READY=false
else
    echo "  ⚠️  Fineract: Status: $FINERACT_STATUS"
    READY=false
fi

echo ""
echo "📝 Recent Logs (last 5 lines):"
docker-compose logs --tail=5 fineract 2>/dev/null || echo "  (No logs available yet)"

echo ""
if [ "$READY" = true ]; then
    echo "✅ Fineract is ready!"
    echo ""
    echo "🔗 Access Fineract:"
    echo "   URL: https://localhost:8443"
    echo "   Username: mifos"
    echo "   Password: password"
    echo "   Tenant: default"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Initialize: npx tsx scripts/init-fineract.ts"
    echo "   2. Test: npx tsx scripts/test-fineract-integration.ts"
else
    echo "⏳ Fineract is still starting..."
    echo ""
    echo "💡 Monitor progress:"
    echo "   docker-compose -f $FINERACT_DIR/docker-compose.yml logs -f fineract"
    echo ""
    echo "   Look for: 'Started FineractApplication in X.XXX seconds'"
    echo "   This indicates Fineract is fully ready."
fi

echo ""
