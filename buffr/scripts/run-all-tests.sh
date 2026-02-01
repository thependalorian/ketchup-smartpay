#!/bin/bash

# Run All Tests Script
# 
# Location: scripts/run-all-tests.sh
# Purpose: Run all test suites for Buffr platform
# 
# Usage:
#   ./scripts/run-all-tests.sh
#   OR
#   chmod +x scripts/run-all-tests.sh && ./scripts/run-all-tests.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

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
    
    if eval "$test_command"; then
        echo ""
        echo -e "${GREEN}✅ ${test_name}: PASSED${NC}"
        echo ""
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo ""
        echo -e "${RED}❌ ${test_name}: FAILED${NC}"
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

run_test "Fineract Integration" \
    "TZ=UTC npx tsx scripts/test-fineract-integration.ts"

# ============================================================================
# TEST SUITE 2: AI Backend Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 2: AI Backend (Python FastAPI)${NC}"
echo ""

# Check if backend is running
if curl -s http://localhost:8001/health > /dev/null 2>&1; then
    run_test "AI Backend Health & Endpoints" \
        "./scripts/test-ai-backend.sh"
else
    echo -e "${YELLOW}⚠️  AI Backend not running on port 8001${NC}"
    echo "   Skipping AI backend tests"
    echo ""
fi

# ============================================================================
# TEST SUITE 3: Jest Unit Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 3: Jest Unit Tests${NC}"
echo ""

if [ -f "node_modules/.bin/jest" ] || command -v jest > /dev/null 2>&1; then
    run_test "Jest Unit Tests" \
        "npm test -- --passWithNoTests"
else
    echo -e "${YELLOW}⚠️  Jest not installed. Skipping unit tests${NC}"
    echo ""
fi

# ============================================================================
# TEST SUITE 4: Database Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 4: Database Connection${NC}"
echo ""

run_test "Database Connection" \
    "npx tsx scripts/test-database.ts"

# ============================================================================
# TEST SUITE 5: API-Database Mapping Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 5: API-Database Mapping${NC}"
echo ""

if [ -f "scripts/test-api-database-mapping.ts" ]; then
    run_test "API-Database Mapping" \
        "npx tsx scripts/test-api-database-mapping.ts"
fi

# ============================================================================
# TEST SUITE 6: Audit Endpoints Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 6: Audit Endpoints${NC}"
echo ""

if [ -f "scripts/test-audit-endpoints.ts" ]; then
    run_test "Audit Endpoints" \
        "npx tsx scripts/test-audit-endpoints.ts"
fi

# ============================================================================
# TEST SUITE 7: All Services Integration Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 7: All Services Integration${NC}"
echo ""

if [ -f "scripts/test-all-services-real.ts" ]; then
    run_test "All Services Integration" \
        "npx tsx scripts/test-all-services-real.ts"
fi

# ============================================================================
# TEST SUITE 8: Validation Tests
# ============================================================================
echo -e "${YELLOW}📋 Test Suite 8: Platform Validation${NC}"
echo ""

if [ -f "scripts/validate-and-test-all.ts" ]; then
    run_test "Platform Validation" \
        "npx tsx scripts/validate-and-test-all.ts"
fi

# ============================================================================
# FINAL SUMMARY
# ============================================================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Test Results Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Total Test Suites: ${TOTAL_TESTS}"
echo -e "${GREEN}✅ Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}❌ Failed: ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    echo ""
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Please review the output above.${NC}"
    echo ""
    exit 1
fi
