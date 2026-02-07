#!/usr/bin/env bash
# Ketchup SmartPay – API validation with curl
# Run from repo root or ketchup-smartpay. Backend must be running on PORT (default 3001).
# Usage: ./scripts/validate-api-curl.sh [BASE_URL]
# Optional: set API_KEY (or KETCHUP_SMARTPAY_API_KEY) so Ketchup/mobile-units routes pass auth.

set -e
BASE="${1:-http://localhost:3001}"
API_KEY="${API_KEY:-${KETCHUP_SMARTPAY_API_KEY:-}}"
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'
FAIL=0

# Curl with optional API key for routes that require auth
curl_cmd() {
  if [[ -n "$API_KEY" ]]; then
    curl -s -o /tmp/curl-out.json -w "%{http_code}" -H "X-API-Key: $API_KEY" -X "$1" "$BASE$2"
  else
    curl -s -o /tmp/curl-out.json -w "%{http_code}" -X "$1" "$BASE$2"
  fi
}

check() {
  local method="$1"
  local path="$2"
  local desc="$3"
  local code
  code=$(curl_cmd "$method" "$path")
  if [[ "$code" == "200" ]] || [[ "$code" == "201" ]]; then
    echo -e "${GREEN}OK${NC} $code $method $path — $desc"
  else
    echo -e "${RED}FAIL${NC} $code $method $path — $desc"
    [[ -f /tmp/curl-out.json ]] && head -c 200 /tmp/curl-out.json && echo
    FAIL=1
  fi
}

echo "Validating Ketchup SmartPay API at $BASE"
echo "----------------------------------------"

# Health
check GET "/health" "Health + DB status"

# Ketchup-facing (auth skipped if no API_KEY env set)
check GET "/api/v1/beneficiaries?limit=2" "Beneficiaries list"
check GET "/api/v1/vouchers?limit=2" "Vouchers list"

# SmartPay Mobile (mobile-units; requires agents with type=mobile_unit – run seed)
check GET "/api/v1/mobile-units" "Mobile units list"
check GET "/api/v1/mobile-units/stats" "Mobile units stats"
check GET "/api/v1/mobile-units/equipment/types" "Equipment types"

# Government monitoring (no auth)
check GET "/api/v1/government/monitoring/regions/summary" "Regions summary"
check GET "/api/v1/government/monitoring/regions" "Regions list"
check GET "/api/v1/government/audit/beneficiaries" "Audit beneficiaries"
check GET "/api/v1/government/analytics/financial" "Analytics financial"

# Government audit (no auth)
check GET "/api/v1/government/audit/transactions" "Audit transactions"
check GET "/api/v1/government/audit/compliance" "Audit compliance"

echo "----------------------------------------"
if [[ $FAIL -eq 0 ]]; then
  echo -e "${GREEN}All checks passed.${NC}"
  exit 0
else
  echo -e "${RED}Some checks failed.${NC}"
  exit 1
fi
