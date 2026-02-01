#!/bin/bash
# Security Audit Script for Buffr API
# Uses OWASP ZAP Docker image

set -e

API_URL="${1:-http://localhost:3000}"
REPORT_DIR="./security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🔒 Starting OWASP ZAP Security Audit..."
echo "Target: $API_URL"
echo "Report Directory: $REPORT_DIR"

# Create report directory
mkdir -p "$REPORT_DIR"

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo "❌ Error: Docker is not installed or not in PATH"
  echo "Please install Docker or use OWASP ZAP GUI instead"
  exit 1
fi

# Check if ZAP Docker image exists
if ! docker images | grep -q "owasp/zap2docker-stable"; then
  echo "📥 Pulling OWASP ZAP Docker image..."
  docker pull owasp/zap2docker-stable
fi

# Run ZAP baseline scan
echo "🔍 Running baseline scan..."
docker run -t \
  -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
  owasp/zap2docker-stable \
  zap-baseline.py \
  -t "$API_URL" \
  -J "zap-report-$TIMESTAMP.json" \
  -r "zap-report-$TIMESTAMP.html" \
  -I \
  || true  # Continue even if scan finds issues

# Check if reports were generated
if [ -f "$REPORT_DIR/zap-report-$TIMESTAMP.html" ]; then
  echo "✅ Baseline scan completed"
  echo "📊 Report saved: $REPORT_DIR/zap-report-$TIMESTAMP.html"
else
  echo "⚠️  Warning: Report file not found"
fi

# Run full active scan if requested
if [ "$2" == "--full" ]; then
  echo "🔍 Running full active scan (this may take 30+ minutes)..."
  docker run -t \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
    owasp/zap2docker-stable \
    zap-full-scan.py \
    -t "$API_URL" \
    -J "zap-full-report-$TIMESTAMP.json" \
    -r "zap-full-report-$TIMESTAMP.html" \
    || true
  
  if [ -f "$REPORT_DIR/zap-full-report-$TIMESTAMP.html" ]; then
    echo "✅ Full scan completed"
    echo "📊 Full report saved: $REPORT_DIR/zap-full-report-$TIMESTAMP.html"
  fi
fi

echo ""
echo "📋 Summary:"
echo "   Reports saved to: $REPORT_DIR"
echo "   - JSON: zap-report-$TIMESTAMP.json"
echo "   - HTML: zap-report-$TIMESTAMP.html"
echo ""
echo "⚠️  Review reports for vulnerabilities and fix Critical/High issues before production."

