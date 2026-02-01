# Fineract Scripts Documentation

**Date:** January 23, 2026  
**Purpose:** Documentation for Fineract initialization and testing scripts

---

## 📋 Available Scripts

### 1. `init-fineract.ts` - Fineract Initialization

**Purpose:** Initialize Fineract with default products, offices, and trust account

**Usage:**
```bash
npx tsx scripts/init-fineract.ts
```

**What it does:**
- ✅ Validates Fineract environment configuration
- ✅ Creates default office (Buffr Head Office)
- ✅ Creates voucher product (for G2P vouchers)
- ✅ Creates wallet product (for digital wallets)
- ✅ Creates trust account product
- ✅ Creates trust account (savings account)

**Prerequisites:**
- Fineract instance running and accessible
- Environment variables configured (`.env.local`)
- Fineract API accessible at configured URL

**Output:**
- Office ID
- Product IDs (voucher, wallet, trust account)
- Trust account ID and account number

---

### 2. `test-fineract-integration.ts` - Integration Testing

**Purpose:** Test Fineract integration end-to-end

**Usage:**
```bash
npx tsx scripts/test-fineract-integration.ts
```

**What it tests:**
- ✅ Environment validation
- ✅ Client creation
- ✅ Get client by external ID
- ✅ Wallet creation (via `getOrCreateWalletForUser`)
- ✅ Wallet deposit
- ✅ Wallet withdrawal
- ✅ Multi-instance routing (read vs write)
- ✅ Voucher creation

**Prerequisites:**
- Fineract instance running
- Initialization script completed successfully
- Products and offices created

**Output:**
- Test results summary
- Pass/fail status for each test
- Total duration
- Error messages for failed tests

---

## 🚀 Quick Start

### Step 1: Start Fineract

```bash
cd fineract
docker-compose -f docker-compose.multi-instance.yml up -d
```

Wait 2-5 minutes for Fineract to initialize.

### Step 2: Initialize Fineract

```bash
cd /Users/georgenekwaya/Downloads/ai-agent-mastery-main/buffr
npx tsx scripts/init-fineract.ts
```

### Step 3: Test Integration

```bash
npx tsx scripts/test-fineract-integration.ts
```

---

## 🔧 Configuration

Both scripts use environment variables from `.env.local`:

```bash
FINERACT_WRITE_URL=https://localhost:8443/fineract-provider/api/v1
FINERACT_WRITE_USERNAME=mifos
FINERACT_WRITE_PASSWORD=password
FINERACT_TENANT_ID=default
TZ=UTC
```

See [Environment Variables Guide](../docs/FINERACT_ENVIRONMENT_VARIABLES.md) for complete configuration.

---

## 🐛 Troubleshooting

### Script fails with "Environment validation failed"

**Solution:**
- Check all environment variables are set
- Verify Fineract URL is accessible
- Ensure timezone is UTC
- See [Environment Variables Guide](../docs/FINERACT_ENVIRONMENT_VARIABLES.md)

### Script fails with "Failed to create office/product"

**Solution:**
- Wait for Fineract to fully initialize (2-5 minutes)
- Check Fineract logs: `docker-compose logs fineract-write`
- Verify API is accessible: `curl -k https://localhost:8443/fineract-provider/api/v1/offices`

### Tests fail with "Client creation failed"

**Solution:**
- Ensure initialization script completed successfully
- Check Fineract is running: `docker-compose ps`
- Verify credentials are correct
- Check Fineract logs for errors

---

## 📚 Related Documentation

- [Fineract Setup Guide](../docs/FINERACT_SETUP_GUIDE.md)
- [Environment Variables](../docs/FINERACT_ENVIRONMENT_VARIABLES.md)
- [Multi-Instance Architecture](../docs/FINERACT_MULTI_INSTANCE_ARCHITECTURE.md)
