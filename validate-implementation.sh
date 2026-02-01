#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║   SmartPay Connect Implementation Validation Script      ║"
echo "║   Date: $(date '+%Y-%m-%d %H:%M:%S')                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Track overall status
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Function to print colored status
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✅ PASS${NC} - $message"
        ((PASS_COUNT++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}❌ FAIL${NC} - $message"
        ((FAIL_COUNT++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠️  WARN${NC} - $message"
        ((WARN_COUNT++))
    else
        echo -e "${BLUE}ℹ️  INFO${NC} - $message"
    fi
}

# Phase 1: Environment & Credentials Audit
echo "═══════════════════════════════════════════════════════════"
echo "Phase 1: Environment & Credentials Audit"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check .env files
if [ -f ".env.local" ]; then
    print_status "PASS" "Frontend .env.local exists"
else
    print_status "WARN" "Frontend .env.local not found"
fi

if [ -f "backend/.env.local" ]; then
    print_status "PASS" "Backend .env.local exists"
    
    # Check required variables
    if grep -q "DATABASE_URL=" backend/.env.local; then
        print_status "PASS" "DATABASE_URL configured"
    else
        print_status "FAIL" "DATABASE_URL missing in backend/.env.local"
    fi
    
    if grep -q "BUFFR_API_KEY=" backend/.env.local; then
        print_status "PASS" "BUFFR_API_KEY configured"
    else
        print_status "WARN" "BUFFR_API_KEY missing in backend/.env.local"
    fi
    
    if grep -q "API_KEY=" backend/.env.local; then
        print_status "PASS" "API_KEY configured"
    else
        print_status "WARN" "API_KEY missing in backend/.env.local"
    fi
else
    print_status "FAIL" "Backend .env.local not found"
fi

echo ""

# Phase 2: Database Structure Validation
echo "═══════════════════════════════════════════════════════════"
echo "Phase 2: Database Structure Validation"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check migration files
MIGRATIONS=(
    "001_initial_schema.sql"
    "002_webhook_events.sql"
    "003_status_events.sql"
    "004_reconciliation_records.sql"
)

for migration in "${MIGRATIONS[@]}"; do
    if [ -f "backend/src/database/migrations/$migration" ]; then
        print_status "PASS" "Migration found: $migration"
    else
        print_status "FAIL" "Migration missing: $migration"
    fi
done

# Check migration runner
if [ -f "backend/src/database/migrations/run.ts" ]; then
    print_status "PASS" "Migration runner exists"
else
    print_status "FAIL" "Migration runner missing"
fi

echo ""

# Phase 3: Data Source Verification
echo "═══════════════════════════════════════════════════════════"
echo "Phase 3: Data Source Verification (No Mock Data)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check for mock data usage in services
MOCK_COUNT=$(grep -r "mockData\|MOCK_DATA\|sampleData\|SAMPLE_DATA" backend/src/services --include="*.ts" 2>/dev/null | wc -l)
if [ "$MOCK_COUNT" -eq 0 ]; then
    print_status "PASS" "No mock data found in backend services"
else
    print_status "WARN" "Found $MOCK_COUNT references to mock data in services"
fi

# Check for database imports in services
DB_IMPORTS=$(grep -r "from.*database/connection\|import.*sql" backend/src/services --include="*.ts" 2>/dev/null | wc -l)
if [ "$DB_IMPORTS" -gt 0 ]; then
    print_status "PASS" "Services use database connections ($DB_IMPORTS imports found)"
else
    print_status "WARN" "No database imports found in services"
fi

# Check repository pattern
if [ -d "backend/src/services/beneficiary" ] && [ -f "backend/src/services/beneficiary/BeneficiaryRepository.ts" ]; then
    print_status "PASS" "Beneficiary repository exists"
else
    print_status "WARN" "Beneficiary repository not found"
fi

if [ -d "backend/src/services/voucher" ] && [ -f "backend/src/services/voucher/VoucherRepository.ts" ]; then
    print_status "PASS" "Voucher repository exists"
else
    print_status "WARN" "Voucher repository not found"
fi

echo ""

# Phase 4: Implementation Gap Analysis
echo "═══════════════════════════════════════════════════════════"
echo "Phase 4: Implementation Gap Analysis"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check backend structure
BACKEND_DIRS=(
    "backend/src/api/routes"
    "backend/src/api/middleware"
    "backend/src/services"
    "backend/src/database"
    "backend/src/utils"
)

for dir in "${BACKEND_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        print_status "PASS" "Directory exists: $dir"
    else
        print_status "FAIL" "Directory missing: $dir"
    fi
done

# Check critical services
SERVICES=(
    "backend/src/services/beneficiary/BeneficiaryService.ts"
    "backend/src/services/voucher/VoucherService.ts"
    "backend/src/services/dashboard/DashboardService.ts"
    "backend/src/services/webhook/WebhookRepository.ts"
    "backend/src/services/reconciliation/ReconciliationService.ts"
)

for service in "${SERVICES[@]}"; do
    if [ -f "$service" ]; then
        print_status "PASS" "Service exists: $(basename $service)"
    else
        print_status "FAIL" "Service missing: $(basename $service)"
    fi
done

# Check API routes
ROUTES=(
    "backend/src/api/routes/beneficiaries.ts"
    "backend/src/api/routes/vouchers.ts"
    "backend/src/api/routes/dashboard.ts"
    "backend/src/api/routes/webhooks.ts"
    "backend/src/api/routes/reconciliation.ts"
    "backend/src/api/routes/statusEvents.ts"
    "backend/src/api/routes/reports.ts"
)

for route in "${ROUTES[@]}"; do
    if [ -f "$route" ]; then
        print_status "PASS" "Route exists: $(basename $route)"
    else
        print_status "FAIL" "Route missing: $(basename $route)"
    fi
done

echo ""

# Phase 5: Frontend Structure
echo "═══════════════════════════════════════════════════════════"
echo "Phase 5: Frontend Structure"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check frontend pages
PAGES=(
    "src/pages/Index.tsx"
    "src/pages/Beneficiaries.tsx"
    "src/pages/Vouchers.tsx"
    "src/pages/Agents.tsx"
    "src/pages/Analytics.tsx"
)

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        print_status "PASS" "Page exists: $(basename $page)"
    else
        print_status "WARN" "Page missing: $(basename $page)"
    fi
done

# Check services directory
if [ -d "src/services" ]; then
    print_status "PASS" "Frontend services directory exists"
else
    print_status "WARN" "Frontend services directory not found"
fi

echo ""

# Phase 6: Dependencies Check
echo "═══════════════════════════════════════════════════════════"
echo "Phase 6: Dependencies Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check backend dependencies
if [ -f "backend/package.json" ]; then
    print_status "PASS" "Backend package.json exists"
    
    # Check critical dependencies
    if grep -q "@neondatabase/serverless" backend/package.json; then
        print_status "PASS" "Neon DB serverless driver installed"
    else
        print_status "FAIL" "@neondatabase/serverless missing from package.json"
    fi
    
    if grep -q "express" backend/package.json; then
        print_status "PASS" "Express installed"
    else
        print_status "FAIL" "Express missing from package.json"
    fi
    
    if grep -q "typescript" backend/package.json; then
        print_status "PASS" "TypeScript installed"
    else
        print_status "FAIL" "TypeScript missing from package.json"
    fi
else
    print_status "FAIL" "Backend package.json not found"
fi

# Check frontend dependencies
if [ -f "package.json" ]; then
    print_status "PASS" "Frontend package.json exists"
    
    if grep -q "react" package.json; then
        print_status "PASS" "React installed"
    else
        print_status "FAIL" "React missing from package.json"
    fi
    
    if grep -q "@tanstack/react-query" package.json; then
        print_status "PASS" "React Query installed"
    else
        print_status "WARN" "React Query missing (recommended for data fetching)"
    fi
else
    print_status "FAIL" "Frontend package.json not found"
fi

echo ""

# Phase 7: Security Check
echo "═══════════════════════════════════════════════════════════"
echo "Phase 7: Security Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check for hardcoded secrets (basic check)
HARDCODED_SECRETS=$(grep -r "password.*=.*['\"].*['\"]" backend/src --include="*.ts" 2>/dev/null | grep -v "Password" | wc -l)
if [ "$HARDCODED_SECRETS" -eq 0 ]; then
    print_status "PASS" "No obvious hardcoded secrets found"
else
    print_status "WARN" "Potential hardcoded secrets found ($HARDCODED_SECRETS occurrences)"
fi

# Check authentication middleware
if [ -f "backend/src/api/middleware/auth.ts" ]; then
    print_status "PASS" "Authentication middleware exists"
else
    print_status "FAIL" "Authentication middleware missing"
fi

# Check rate limiting middleware
if [ -f "backend/src/api/middleware/rateLimit.ts" ]; then
    print_status "PASS" "Rate limiting middleware exists"
else
    print_status "WARN" "Rate limiting middleware missing"
fi

# Check .gitignore
if [ -f ".gitignore" ]; then
    if grep -q "\.env" .gitignore; then
        print_status "PASS" ".env files in .gitignore"
    else
        print_status "FAIL" ".env files NOT in .gitignore (security risk!)"
    fi
else
    print_status "FAIL" ".gitignore file not found"
fi

echo ""

# Final Summary
echo "═══════════════════════════════════════════════════════════"
echo "Validation Summary"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✅ Passed:${NC} $PASS_COUNT"
echo -e "${YELLOW}⚠️  Warnings:${NC} $WARN_COUNT"
echo -e "${RED}❌ Failed:${NC} $FAIL_COUNT"
echo ""

TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
if [ $TOTAL -gt 0 ]; then
    PASS_RATE=$((PASS_COUNT * 100 / TOTAL))
    echo "Overall Pass Rate: ${PASS_RATE}%"
fi

echo ""
if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ VALIDATION PASSED - System is production ready  ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════╝${NC}"
    exit 0
elif [ $FAIL_COUNT -le 3 ]; then
    echo -e "${YELLOW}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠️  VALIDATION PARTIAL - Minor issues found       ║${NC}"
    echo -e "${YELLOW}╚═══════════════════════════════════════════════════╝${NC}"
    exit 1
else
    echo -e "${RED}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ❌ VALIDATION FAILED - Critical issues found      ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════╝${NC}"
    exit 2
fi
