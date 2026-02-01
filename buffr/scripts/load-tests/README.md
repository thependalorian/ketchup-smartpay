# Load Testing Guide
## Buffr Payment Companion API

**Location:** `scripts/load-tests/`  
**Purpose:** Load testing scripts and documentation  
**Last Updated:** December 18, 2025

---

## Overview

Load testing ensures the Buffr API can handle expected production traffic. This guide covers setup and execution of load tests using k6.

---

## Prerequisites

### Install k6

```bash
# macOS
brew install k6

# Linux
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6

# Docker
docker pull grafana/k6
```

---

## Running Load Tests

### Basic Test

```bash
# Run payment API load test
k6 run scripts/load-tests/k6-payment-api.js

# With custom API URL
API_URL=http://localhost:3000 k6 run scripts/load-tests/k6-payment-api.js

# With authentication token
AUTH_TOKEN=your-jwt-token k6 run scripts/load-tests/k6-payment-api.js
```

### Test Scenarios

1. **Payment Endpoint Load Test:**
   ```bash
   k6 run scripts/load-tests/k6-payment-api.js
   ```
   - Tests: Payment sending, wallet operations, transactions
   - Load: Ramp to 100 concurrent users
   - Duration: ~10 minutes

2. **Database Connection Pool Test:**
   ```bash
   # Test with high concurrency to find pool limits
   k6 run --vus 200 --duration 5m scripts/load-tests/k6-payment-api.js
   ```

3. **AI Agent Endpoints Test:**
   ```bash
   # Test Scout Agent and other AI endpoints
   k6 run scripts/load-tests/k6-ai-endpoints.js
   ```

---

## Performance Benchmarks

### Target Metrics

| Metric | Target | Critical |
|--------|--------|----------|
| Average Response Time | < 300ms | < 500ms |
| 95th Percentile | < 500ms | < 1000ms |
| 99th Percentile | < 1000ms | < 2000ms |
| Error Rate | < 0.1% | < 1% |
| Payment Success Rate | > 99% | > 95% |
| Throughput | > 100 req/s | > 50 req/s |

### Endpoint-Specific Targets

| Endpoint | Target Response Time | Notes |
|----------|---------------------|-------|
| `/api/auth/login` | < 500ms | Rate limited (5 req/15min) |
| `/api/payments/send` | < 1000ms | Includes payment gateway call |
| `/api/wallets/[id]` | < 300ms | Simple DB query |
| `/api/transactions` | < 500ms | May include pagination |
| `/api/scout/search` | < 5000ms | AI agent, longer timeout |

---

## Test Results Interpretation

### Good Results ✅

```
✓ payment status is 200 or 201
✓ payment response time < 1000ms
✓ http_req_duration: p(95)=450ms
✓ http_req_failed: rate=0.00%
✓ payment_success_rate: rate=0.99
```

### Issues to Investigate ⚠️

1. **High Response Times:**
   - Check database query performance
   - Check external API calls (Adumo, exchange rates)
   - Check AI agent response times
   - Consider caching

2. **High Error Rate:**
   - Check rate limiting (429 errors expected)
   - Check authentication failures
   - Check database connection pool exhaustion
   - Check memory/CPU limits

3. **Payment Failures:**
   - Check payment gateway availability
   - Check validation errors
   - Check database transaction locks

---

## Continuous Load Testing

### CI/CD Integration

Add to `.github/workflows/ci.yml`:

```yaml
load-test:
  name: Load Test
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - name: Install k6
      run: |
        sudo gpg -k
        sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    - name: Start API server
      run: npm start --prefix buffr &
    - name: Wait for server
      run: sleep 10
    - name: Run load test
      run: k6 run buffr/scripts/load-tests/k6-payment-api.js
      env:
        API_URL: http://localhost:3000
```

---

## Monitoring During Load Tests

### Key Metrics to Monitor

1. **API Server:**
   - CPU usage
   - Memory usage
   - Request rate
   - Error rate
   - Response times

2. **Database (Neon):**
   - Connection pool usage
   - Query performance
   - Transaction locks
   - CPU/Memory usage

3. **External Services:**
   - Adumo payment gateway response times
   - Exchange rate API response times
   - AI backend response times

---

## Troubleshooting

### Common Issues

1. **Connection Refused:**
   - Ensure API server is running
   - Check API_URL is correct
   - Check firewall/network settings

2. **Rate Limiting (429 errors):**
   - Expected for auth endpoints
   - Adjust test frequency if needed
   - Consider using multiple test tokens

3. **Database Connection Pool Exhausted:**
   - Increase pool size in Neon dashboard
   - Optimize slow queries
   - Add connection retry logic

4. **High Memory Usage:**
   - Reduce concurrent users
   - Check for memory leaks
   - Optimize response sizes

---

## Next Steps

1. **Run Baseline Test:**
   ```bash
   k6 run scripts/load-tests/k6-payment-api.js
   ```

2. **Document Results:**
   - Save test results
   - Document performance benchmarks
   - Identify bottlenecks

3. **Optimize:**
   - Fix identified bottlenecks
   - Re-run tests to verify improvements

4. **Schedule Regular Tests:**
   - Weekly load tests
   - Before major releases
   - After infrastructure changes

---

## References

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://github.com/grafana/k6/tree/master/examples)
- [Performance Testing Best Practices](https://k6.io/docs/test-types/load-testing/)

