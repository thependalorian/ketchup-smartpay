#!/bin/bash

# Buffr AI Backend API Endpoint Testing Script
# Tests all major endpoints with sample data

BASE_URL="http://localhost:8000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🧪 Testing Buffr AI Backend Endpoints"
echo "======================================"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}/health")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Health check failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 2: Companion Chat
echo "2️⃣  Testing Companion Chat..."
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/companion/chat" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, what can you help me with?",
    "userId": "test-user-123"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Companion chat working${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body" | head -20
else
    echo -e "${RED}❌ Companion chat failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 3: Exchange Rates
echo "3️⃣  Testing Exchange Rates..."
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/scout/exchange-rates" \
  -H "Content-Type: application/json" \
  -d '{
    "base_currency": "NAD",
    "target_currencies": ["USD", "EUR", "ZAR"]
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Exchange rates working${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Exchange rates failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 4: Fraud Check
echo "4️⃣  Testing Fraud Detection..."
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/guardian/fraud/check" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-txn-001",
    "amount": 5000,
    "merchant_name": "Test Merchant",
    "merchant_mcc": 5411,
    "user_location": {"lat": -22.9576, "lon": 18.4904},
    "merchant_location": {"lat": -22.9576, "lon": 18.4904},
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "device_fingerprint": "test-device-123",
    "card_present": false
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Fraud detection working${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body" | head -20
else
    echo -e "${RED}❌ Fraud detection failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

# Test 5: Transaction Classification
echo "5️⃣  Testing Transaction Classification..."
response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/transaction-analyst/classify" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-txn-002",
    "merchant_name": "Pick n Pay",
    "amount": 250.50,
    "merchant_mcc": 5411,
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✅ Transaction classification working${NC}"
    echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
else
    echo -e "${RED}❌ Transaction classification failed (HTTP $http_code)${NC}"
    echo "$body"
fi
echo ""

echo "======================================"
echo "✅ Endpoint testing complete!"
echo ""
echo "Note: Some endpoints may require valid API keys or database setup"
echo ""
