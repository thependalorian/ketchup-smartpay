#!/bin/bash

# Fineract Monitoring Script
# 
# Purpose: Monitor Fineract startup progress in real-time
# Usage: ./scripts/monitor-fineract.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FINERACT_DIR="$SCRIPT_DIR/../fineract"

cd "$FINERACT_DIR"

echo "📊 Monitoring Fineract Startup..."
echo "=========================================="
echo ""
echo "Looking for: 'Started FineractApplication in X.XXX seconds'"
echo "This indicates Fineract is fully ready."
echo ""
echo "Press Ctrl+C to stop monitoring"
echo ""

# Follow logs and highlight important messages
docker-compose logs -f fineract 2>/dev/null | grep --line-buffered -E "(Started FineractApplication|ERROR|Exception|ready|health)" || \
docker-compose logs -f fineract
