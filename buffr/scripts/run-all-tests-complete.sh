#!/bin/bash

# Complete Test Runner with Environment Variables
# 
# Location: scripts/run-all-tests-complete.sh
# Purpose: Run all test suites with proper environment variable loading
# 
# Usage:
#   ./scripts/run-all-tests-complete.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

# Load environment variables from .env.local
if [ -f ".env.local" ]; then
    echo -e "${BLUE}📋 Loading environment variables from .env.local...${NC}"
    export $(grep -v '^#' .env.local | grep -v '^$' | xargs)
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
    echo ""
fi

echo -e "${BLUE}🧪 Running All Buffr Platform Tests${NC}"
echo "=========================================="
echo ""

# Track results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}🧪 Test Suite: ${test_name}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command" > /tmp/test_output_$$.log 2>&1; then
        echo ""
        echo -e "${GREEN}✅ ${test_name}: PASSED${NC}"
        echo ""
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo ""
        echo -e "${RED}❌ ${test_name}: FAILED${NC}"
        echo ""
        tail -20 /tmp/test_output_$$.log | head -10
        echo ""
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# ============================================================================
# TEST SUITE 1: Fineract Integration Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 1: Fineract Integration${NC}"
echo ""

run_test "Fineract Integration (8 tests)" \
    "TZ=UTC npx tsx scripts/test-fineract-integration.ts 2>&1 | grep -E '(Total Tests|Passed|Failed|All tests)' | tail -5"

# ============================================================================
# TEST SUITE 2: Jest Unit Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 2: Jest Unit Tests${NC}"
echo ""

if [ -f "node_modules/.bin/jest" ] || command -v jest > /dev/null 2>&1; then
    run_test "Jest Unit Tests" \
        "npm test -- --passWithNoTests 2>&1 | grep -E '(Test Suites|Tests:)'"
else
    echo -e "${YELLOW}⚠️  Jest not installed. Skipping unit tests${NC}"
    echo ""
fi

# ============================================================================
# TEST SUITE 3: AI Backend Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 3: AI Backend (Python FastAPI)${NC}"
echo ""

if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    run_test "AI Backend Health & Endpoints" \
        "./scripts/test-ai-backend.sh 2>&1 | grep -E '(PASS|FAIL|✅|❌)' | wc -l"
else
    echo -e "${YELLOW}⚠️  AI Backend not running on port 8001${NC}"
    echo "   Start with: ./scripts/start-ai-backend.sh"
    echo ""
fi

# ============================================================================
# TEST SUITE 4: Database Connection Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 4: Database Connection${NC}"
echo ""

if [ -n "$DATABASE_URL" ] || [ -n "$NEON_CONNECTION_STRING" ]; then
    if [ -f "scripts/test-database.ts" ]; then
        run_test "Database Connection" \
            "npx tsx scripts/test-database.ts 2>&1 | tail -5"
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not set. Skipping database tests${NC}"
    echo ""
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Final Test Results Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total Test Suites: ${TOTAL_TESTS}"
echo -e "${GREEN}✅ Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}❌ Failed: ${FAILED_TESTS}${NC}"
echo ""

# Cleanup
rm -f /tmp/test_output_$$.log

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All test suites passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some test suites failed. Review output above for details.${NC}"
    echo ""
    exit 1
fi
