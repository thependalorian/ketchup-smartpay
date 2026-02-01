#!/bin/bash

# Database Integration Execution Script
# This script runs all database integration steps

set -e  # Exit on error

echo "🚀 Starting Database Integration Execution"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${RED}❌ Error: .env.local file not found${NC}"
    echo "Please create .env.local with DATABASE_URL"
    exit 1
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL" .env.local; then
    echo -e "${RED}❌ Error: DATABASE_URL not found in .env.local${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environment file found${NC}"
echo ""

# Step 1: Test connection
echo -e "${YELLOW}Step 1: Testing database connection...${NC}"
if npx tsx scripts/test-database.ts; then
    echo -e "${GREEN}✅ Connection test passed${NC}"
else
    echo -e "${RED}❌ Connection test failed${NC}"
    exit 1
fi
echo ""

# Step 2: Run migration
echo -e "${YELLOW}Step 2: Running database migration...${NC}"
if npx tsx scripts/migrate-database.ts; then
    echo -e "${GREEN}✅ Migration completed${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi
echo ""

# Step 3: Verify migration
echo -e "${YELLOW}Step 3: Verifying migration...${NC}"
if npx tsx scripts/test-database.ts; then
    echo -e "${GREEN}✅ Verification passed${NC}"
else
    echo -e "${RED}❌ Verification failed${NC}"
    exit 1
fi
echo ""

# Step 4: Seed test data (optional)
read -p "Do you want to seed test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Step 4: Seeding test data...${NC}"
    if npx tsx scripts/seed-test-data.ts; then
        echo -e "${GREEN}✅ Test data seeded${NC}"
    else
        echo -e "${RED}❌ Seeding failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}Skipping test data seeding${NC}"
fi
echo ""

echo -e "${GREEN}🎉 Database integration execution completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Start the Expo server: npm start"
echo "2. Test API endpoints with real database"
echo "3. Verify data persistence"
echo ""
