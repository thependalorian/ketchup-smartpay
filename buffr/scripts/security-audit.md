# Security Audit Guide
## OWASP ZAP Security Scanning

**Location:** `scripts/security-audit.md`  
**Purpose:** Guide for running security audits on Buffr API endpoints  
**Last Updated:** December 18, 2025

---

## Overview

This guide provides instructions for running OWASP ZAP (Zed Attack Proxy) security scans on the Buffr Payment Companion API endpoints. Regular security audits are required for PSD-1 compliance.

---

## Prerequisites

1. **OWASP ZAP Installation:**
   ```bash
   # Option 1: Download from https://www.zaproxy.org/download/
   # Option 2: Install via Docker
   docker pull owasp/zap2docker-stable
   
   # Option 3: Install via Homebrew (macOS)
   brew install --cask owasp-zap
   ```

2. **API Endpoints to Scan:**
   - Authentication: `/api/auth/login`, `/api/auth/refresh`
   - Payments: `/api/payments/send`, `/api/wallets/[id]/add-money`
   - Compliance: `/api/compliance/*`
   - Admin: `/api/admin/*`
   - User Data: `/api/users/*`, `/api/wallets/*`, `/api/transactions/*`

---

## Running OWASP ZAP Scan

### Method 1: Automated Scan Script

```bash
# Run automated scan
cd buffr
./scripts/run-security-audit.sh
```

### Method 2: Manual ZAP Scan

1. **Start ZAP:**
   ```bash
   zap.sh  # or open ZAP GUI
   ```

2. **Configure Target:**
   - Set target URL: `http://localhost:3000` (or production URL)
   - Configure authentication if needed (JWT tokens)

3. **Run Quick Scan:**
   - Right-click on target → Attack → Quick Start Scan
   - Or use: Tools → Quick Start → Automated Scan

4. **Run Full Scan:**
   - Spider scan first (crawl all endpoints)
   - Active scan (test for vulnerabilities)

5. **Review Results:**
   - Check Alerts tab for vulnerabilities
   - Export report: Report → Generate Report

---

## Key Vulnerabilities to Check

### Critical (Must Fix Before Production)

1. **SQL Injection**
   - Test all input parameters
   - Verify parameterized queries are used
   - Check: `/api/payments/send`, `/api/wallets/*`, `/api/admin/*`

2. **Authentication Bypass**
   - Test JWT token validation
   - Test admin role checks
   - Check: All protected endpoints

3. **Cross-Site Scripting (XSS)**
   - Test input sanitization
   - Check response headers (X-XSS-Protection)
   - Check: All endpoints accepting user input

4. **Cross-Site Request Forgery (CSRF)**
   - Test CSRF token validation
   - Check: POST/PUT/DELETE endpoints

5. **Sensitive Data Exposure**
   - Check for exposed secrets in responses
   - Check for exposed user data
   - Verify HTTPS enforcement

### High Priority

6. **Insecure Direct Object References**
   - Test authorization checks
   - Verify users can't access other users' data
   - Check: `/api/wallets/[id]`, `/api/transactions/[id]`

7. **Security Misconfiguration**
   - Check security headers (CSP, HSTS, etc.)
   - Check error messages (no stack traces)
   - Check default credentials

8. **Insufficient Logging & Monitoring**
   - Verify authentication failures are logged
   - Verify rate limit violations are logged
   - Check audit trail for compliance endpoints

---

## Automated Security Audit Script

Create `scripts/run-security-audit.sh`:

```bash
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

# Run ZAP baseline scan
echo "Running baseline scan..."
docker run -t \
  -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
  owasp/zap2docker-stable \
  zap-baseline.py \
  -t "$API_URL" \
  -J "zap-report-$TIMESTAMP.json" \
  -r "zap-report-$TIMESTAMP.html" \
  -I

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ Baseline scan completed successfully"
else
  echo "⚠️  Baseline scan found issues (exit code: $?)"
  echo "Review report: $REPORT_DIR/zap-report-$TIMESTAMP.html"
fi

# Run full active scan (optional, takes longer)
if [ "$2" == "--full" ]; then
  echo "Running full active scan (this may take 30+ minutes)..."
  docker run -t \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
    owasp/zap2docker-stable \
    zap-full-scan.py \
    -t "$API_URL" \
    -J "zap-full-report-$TIMESTAMP.json" \
    -r "zap-full-report-$TIMESTAMP.html"
fi

echo "📊 Reports saved to: $REPORT_DIR"
echo "   - JSON: zap-report-$TIMESTAMP.json"
echo "   - HTML: zap-report-$TIMESTAMP.html"
```

---

## Expected Results

### Pass Criteria

- ✅ No Critical vulnerabilities
- ✅ No High vulnerabilities
- ✅ Medium vulnerabilities documented and accepted
- ✅ All authentication endpoints protected
- ✅ All payment endpoints protected
- ✅ Security headers present

### Fail Criteria

- ❌ Any Critical vulnerabilities → **BLOCK PRODUCTION**
- ❌ Any High vulnerabilities in payment/auth endpoints → **BLOCK PRODUCTION**
- ❌ SQL injection vulnerabilities → **BLOCK PRODUCTION**
- ❌ Authentication bypass → **BLOCK PRODUCTION**

---

## Remediation Process

1. **Review Report:**
   - Identify all Critical and High vulnerabilities
   - Document Medium vulnerabilities for future fixes

2. **Fix Vulnerabilities:**
   - Prioritize Critical → High → Medium
   - Update code to fix issues
   - Test fixes locally

3. **Re-scan:**
   - Run scan again after fixes
   - Verify vulnerabilities are resolved

4. **Document:**
   - Update `PRODUCTION_REMEDIATION_PLAN.md`
   - Document fixes in code comments
   - Schedule next audit (quarterly)

---

## Integration with CI/CD

Add to `.github/workflows/ci.yml`:

```yaml
security-audit:
  name: Security Audit (OWASP ZAP)
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Run OWASP ZAP Scan
      run: |
        docker run -t owasp/zap2docker-stable \
          zap-baseline.py -t http://localhost:3000 -J zap-report.json
    - name: Upload Report
      uses: actions/upload-artifact@v3
      with:
        name: security-report
        path: zap-report.json
```

---

## Annual Penetration Test

**PSD-1 Requirement:** Annual external penetration test

1. **Schedule:** Once per year (recommended: Q1)
2. **Provider:** External security firm
3. **Scope:** All API endpoints, mobile app, infrastructure
4. **Deliverables:**
   - Penetration test report
   - Vulnerability remediation plan
   - Re-test after fixes

---

## References

- [OWASP ZAP Documentation](https://www.zaproxy.org/docs/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PSD-1 Security Requirements](https://www.bon.com.na/)

---

**Next Steps:**
1. Install OWASP ZAP
2. Run baseline scan on staging environment
3. Review and fix any Critical/High vulnerabilities
4. Schedule annual penetration test

