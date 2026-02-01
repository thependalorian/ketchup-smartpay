#!/bin/bash

# AI Backend Testing Script
# Tests all Python AI backend endpoints
# 
# IMPORTANT: Make sure Python AI backend is running!
# Start it with: ./scripts/start-ai-backend.sh
# OR manually: cd buffr_ai && source .venv/bin/activate && python -m uvicorn main:app --port 8001

set -e

# Load environment variables from .env.local if it exists
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}")" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

if [ -f "$PROJECT_ROOT/.env.local" ]; then
    echo "📋 Loading environment variables from .env.local..."
    set -a
    source <(grep -v '^#' "$PROJECT_ROOT/.env.local" | grep -v '^$' | sed 's/^/export /' 2>/dev/null || true)
    set +a
    echo "✅ Environment variables loaded"
    echo ""
fi

BASE_URL="${AI_BACKEND_URL:-http://localhost:8001}"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing AI Backend at $BASE_URL"
echo ""
echo -e "${YELLOW}⚠️  Make sure Python AI backend is running!${NC}"
echo "   Start with: ./scripts/start-ai-backend.sh"
echo "   OR: cd buffr_ai && source .venv/bin/activate && python -m uvicorn main:app --port 8001"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Health check successful"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAIL${NC} - Health check failed (HTTP $http_code)"
    echo "$body"
fi
echo ""

# Test 2: Service Info
echo "Test 2: Service Info"
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Service info retrieved"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAIL${NC} - Service info failed (HTTP $http_code)"
fi
echo ""

# Test 3: Companion Chat (camelCase)
echo "Test 3: Companion Chat (camelCase)"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/companion/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what is Buffr?",
    "userId": "test-user-123",
    "sessionId": "test-session-456"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Companion chat (camelCase)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAIL${NC} - Companion chat failed (HTTP $http_code)"
    echo "$body"
fi
echo ""

# Test 4: Companion Chat (snake_case)
echo "Test 4: Companion Chat (snake_case)"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/companion/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello again",
    "user_id": "test-user-123",
    "session_id": "test-session-456"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Companion chat (snake_case)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAIL${NC} - Companion chat failed (HTTP $http_code)"
    echo "$body"
fi
echo ""

# Test 5: Guardian Fraud Check
echo "Test 5: Guardian Fraud Check"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/guardian/fraud/check" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-tx-123",
    "amount": 15000,
    "merchant_name": "Unknown Merchant",
    "merchant_mcc": 5411,
    "user_location": {"lat": -22.5700, "lon": 17.0836},
    "merchant_location": {"lat": -22.5600, "lon": 17.0900},
    "timestamp": "2026-01-22T02:30:00Z",
    "device_fingerprint": "test-device-123",
    "card_present": false,
    "beneficiary_account_age_days": 30
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Guardian fraud check"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAIL${NC} - Guardian fraud check failed (HTTP $http_code)"
    echo "$body"
fi
echo ""

# Test 6: Transaction Analyst Analyze
echo "Test 6: Transaction Analyst Analyze"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/transaction-analyst/analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "transactions": [
      {"transaction_id": "tx1", "amount": 500, "category": "food", "timestamp": "2026-01-20T10:00:00Z"}
    ],
    "time_period_days": 30
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Transaction analyst analyze"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAIL${NC} - Transaction analyst analyze failed (HTTP $http_code)"
    echo "$body"
fi
echo ""

# Test 7: Simple Chat (using Companion chat endpoint)
echo "Test 7: Companion Chat (Simple Query)"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/companion/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is Buffr?",
    "user_id": "test-user-123"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Companion chat (simple query)"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ FAIL${NC} - Companion chat failed (HTTP $http_code)"
    echo "$body"
fi
echo ""

# Test 8: Streaming Chat (check if endpoint exists)
echo "Test 8: Streaming Chat Endpoint Check"
response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/companion/chat/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test streaming",
    "userId": "test-user-123"
  }' \
  --max-time 5)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" -eq 200 ]; then
    echo -e "${GREEN}✅ PASS${NC} - Streaming endpoint accessible"
    echo -e "${YELLOW}Note:${NC} Full streaming test requires SSE client"
else
    echo -e "${RED}❌ FAIL${NC} - Streaming endpoint failed (HTTP $http_code)"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Testing Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 For comprehensive API-to-Database mapping tests, run:"
echo "   npx tsx scripts/test-api-database-mapping.ts"
echo ""
echo "📚 See docs/TESTING_API_DATABASE_MAPPING.md for full test suite"
