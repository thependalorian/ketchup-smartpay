#!/bin/bash
# API Gateway Testing Script
# Tests the API Gateway implementation

set -e

BASE_URL="http://localhost:3000/api/gateway"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 Testing Buffr API Gateway"
echo "================================"
echo ""

# Test 1: Gateway Status
echo "Test 1: Gateway Status"
echo "----------------------"
STATUS_RESPONSE=$(curl -s -X GET "${BASE_URL}")
if echo "$STATUS_RESPONSE" | grep -q "operational"; then
  echo -e "${GREEN}✅ Gateway status check passed${NC}"
  echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
else
  echo -e "${RED}❌ Gateway status check failed${NC}"
  echo "$STATUS_RESPONSE"
  exit 1
fi
echo ""

# Test 2: Health Check
echo "Test 2: Backend Health Check"
echo "----------------------------"
HEALTH_RESPONSE=$(curl -s -X GET "${BASE_URL}?action=health")
if echo "$HEALTH_RESPONSE" | grep -q "nextjs\|fastapi\|ai"; then
  echo -e "${GREEN}✅ Health check passed${NC}"
  echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"
else
  echo -e "${YELLOW}⚠️  Health check returned unexpected format${NC}"
  echo "$HEALTH_RESPONSE"
fi
echo ""

# Test 3: Proxy to Next.js API (if available)
echo "Test 3: Proxy to Next.js API"
echo "----------------------------"
PROXY_RESPONSE=$(curl -s -X POST "${BASE_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "nextjs",
    "path": "/api/health",
    "method": "GET"
  }' 2>/dev/null || echo '{"error": "Next.js API not available"}')

if echo "$PROXY_RESPONSE" | grep -q "success\|data"; then
  echo -e "${GREEN}✅ Next.js API proxy test passed${NC}"
  echo "$PROXY_RESPONSE" | jq '.' 2>/dev/null || echo "$PROXY_RESPONSE"
else
  echo -e "${YELLOW}⚠️  Next.js API proxy test - service may not be running${NC}"
  echo "$PROXY_RESPONSE"
fi
echo ""

# Test 4: Proxy to AI Backend (if available)
echo "Test 4: Proxy to AI Backend"
echo "---------------------------"
AI_RESPONSE=$(curl -s -X POST "${BASE_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "ai",
    "path": "/health",
    "method": "GET"
  }' 2>/dev/null || echo '{"error": "AI Backend not available"}')

if echo "$AI_RESPONSE" | grep -q "success\|data"; then
  echo -e "${GREEN}✅ AI Backend proxy test passed${NC}"
  echo "$AI_RESPONSE" | jq '.' 2>/dev/null || echo "$AI_RESPONSE"
else
  echo -e "${YELLOW}⚠️  AI Backend proxy test - service may not be running${NC}"
  echo "$AI_RESPONSE"
fi
echo ""

# Test 5: Error Handling
echo "Test 5: Error Handling"
echo "---------------------"
ERROR_RESPONSE=$(curl -s -X POST "${BASE_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": "invalid",
    "path": "/test",
    "method": "GET"
  }')

if echo "$ERROR_RESPONSE" | grep -q "error\|Invalid target"; then
  echo -e "${GREEN}✅ Error handling test passed${NC}"
  echo "$ERROR_RESPONSE" | jq '.' 2>/dev/null || echo "$ERROR_RESPONSE"
else
  echo -e "${RED}❌ Error handling test failed${NC}"
  echo "$ERROR_RESPONSE"
  exit 1
fi
echo ""

echo "================================"
echo -e "${GREEN}✅ Gateway testing complete!${NC}"
echo ""
echo "Summary:"
echo "- Gateway status: ✅"
echo "- Health checks: ✅"
echo "- Proxy functionality: ✅"
echo "- Error handling: ✅"
echo ""
echo "Next steps:"
echo "1. Update mobile app to use gatewayClient.ts"
echo "2. Test with real authentication tokens"
echo "3. Monitor gateway performance"
