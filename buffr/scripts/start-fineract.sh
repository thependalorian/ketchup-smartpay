#!/bin/bash

# Fineract Startup Script
# 
# Purpose: Start Fineract instances with proper configuration
# Usage: ./scripts/start-fineract.sh [single|multi]
# 
# Options:
#   single - Start single instance (default, for development)
#   multi  - Start multi-instance setup (for production testing)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FINERACT_DIR="$SCRIPT_DIR/../fineract"
INSTANCE_TYPE="${1:-single}"

echo "🚀 Starting Fineract ($INSTANCE_TYPE instance)..."
echo "=========================================="
echo ""

cd "$FINERACT_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if images need to be pulled
echo "📦 Checking Docker images..."
if [ "$INSTANCE_TYPE" = "multi" ]; then
    echo "   Using multi-instance setup..."
    COMPOSE_FILE="docker-compose.multi-instance.yml"
else
    echo "   Using single instance setup..."
    COMPOSE_FILE="docker-compose.yml"
fi

# Start services
echo ""
echo "🚀 Starting Fineract services..."
docker-compose -f "$COMPOSE_FILE" up -d

echo ""
echo "⏳ Waiting for services to start (this may take 2-5 minutes)..."
echo "   Fineract needs time to initialize the database and start the application."
echo ""

# Wait for database to be healthy
echo "📊 Waiting for database to be ready..."
timeout=60
elapsed=0
while [ $elapsed -lt $timeout ]; do
    if docker-compose -f "$COMPOSE_FILE" ps db 2>/dev/null | grep -q "healthy"; then
        echo "✅ Database is healthy"
        break
    fi
    sleep 2
    elapsed=$((elapsed + 2))
    echo "   Waiting... ($elapsed/$timeout seconds)"
done

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo "📋 Next Steps:"
echo "   1. Wait 2-5 minutes for Fineract to fully initialize"
echo "   2. Check logs: docker-compose -f $COMPOSE_FILE logs -f fineract"
echo "   3. Once started, run: npx tsx scripts/init-fineract.ts"
echo "   4. Test integration: npx tsx scripts/test-fineract-integration.ts"
echo ""
echo "🔍 Monitor startup progress:"
echo "   docker-compose -f $COMPOSE_FILE logs -f fineract"
echo ""
echo "✅ Fineract startup initiated!"
echo "   Access Fineract at: https://localhost:8443"
echo "   Default credentials: mifos / password"
echo ""
