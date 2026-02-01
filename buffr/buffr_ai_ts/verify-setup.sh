#!/bin/bash

# Buffr AI Backend Setup Verification Script
# This script verifies all components are configured correctly

echo "🔍 Buffr AI Backend Setup Verification"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
echo "1️⃣  Checking .env file..."
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"
    
    # Check required variables
    echo "   Checking required environment variables..."
    required_vars=("DATABASE_URL" "LLM_PROVIDER" "DEEPSEEK_API_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env; then
            value=$(grep "^${var}=" .env | cut -d'=' -f2)
            if [ -z "$value" ] || [ "$value" = "xxx" ] || [ "$value" = "sk-xxx" ]; then
                echo -e "${YELLOW}⚠️  ${var} is set but appears to be a placeholder${NC}"
                missing_vars+=("${var}")
            else
                echo -e "${GREEN}   ✅ ${var} is configured${NC}"
            fi
        else
            echo -e "${RED}   ❌ ${var} is missing${NC}"
            missing_vars+=("${var}")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ All required environment variables are configured${NC}"
    else
        echo -e "${RED}❌ Missing or incomplete environment variables: ${missing_vars[*]}${NC}"
        echo "   Please update .env file with actual values"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo "   Copy env.example.txt to .env and configure it"
    exit 1
fi

echo ""

# Check if node_modules exists
echo "2️⃣  Checking dependencies..."
if [ -d node_modules ]; then
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${RED}❌ Dependencies not installed${NC}"
    echo "   Run: npm install"
    exit 1
fi

echo ""

# Check if TypeScript is compiled
echo "3️⃣  Checking TypeScript build..."
if [ -d dist ]; then
    echo -e "${GREEN}✅ TypeScript compiled (dist/ directory exists)${NC}"
else
    echo -e "${YELLOW}⚠️  TypeScript not compiled yet${NC}"
    echo "   Run: npm run build (or use npm run dev for development)"
fi

echo ""

# Check if server is running
echo "4️⃣  Checking if server is running..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running on http://localhost:8000${NC}"
    echo "   Health check response:"
    curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8000/health
else
    echo -e "${YELLOW}⚠️  Server is not running${NC}"
    echo "   Start server with: npm run dev"
fi

echo ""

# Test database connection (if server is running)
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "5️⃣  Testing database connection..."
    # The health endpoint should indicate database status
    health_response=$(curl -s http://localhost:8000/health)
    if echo "$health_response" | grep -q "operational\|ok"; then
        echo -e "${GREEN}✅ Database connection appears to be working${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not verify database connection${NC}"
        echo "   Check server logs for database errors"
    fi
else
    echo "5️⃣  Database connection test skipped (server not running)"
fi

echo ""
echo "======================================"
echo "✅ Setup verification complete!"
echo ""
echo "Next steps:"
echo "  1. If server is not running: npm run dev"
echo "  2. Test endpoints: curl http://localhost:8000/health"
echo "  3. Test companion chat: See README.md for examples"
echo ""
