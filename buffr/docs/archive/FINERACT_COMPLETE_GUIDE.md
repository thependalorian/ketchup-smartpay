# Fineract Complete Guide

**Date:** January 26, 2026  
**Status:** ✅ **Phase 1 Complete - Production Ready**  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Guide](#setup-guide)
4. [Environment Variables](#environment-variables)
5. [Integration Plan](#integration-plan)
5. [API Reference](#api-reference)
6. [SSL Configuration](#ssl-configuration)
7. [Multi-Instance Setup](#multi-instance-setup)

---

## Overview

Apache Fineract serves as the core banking system for the Buffr G2P voucher platform, providing:
- **Client Management** - Beneficiary accounts
- **Savings Accounts** - Vouchers and wallets
- **Transactions** - All financial operations
- **GL Accounting** - Automatic double-entry bookkeeping

### Integration Strategy

**Phase 1: Core API Integration** (✅ Complete)
- Use Fineract's core features (Client, Savings Account)
- Buffr Next.js backend as orchestration layer
- Multi-instance setup (Write/Read/Batch)

**Phase 2: Custom Modules** (Optional)
- Custom voucher module (if needed)
- Custom wallet module (if needed)
- Plugin architecture

---

## Architecture

### Multi-Instance Setup

```
┌─────────────────┐
│  Write Instance │  Port 8443 - All mutations
│  (Primary)      │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
┌───▼───┐ ┌───▼───┐
│ Read  │ │ Read  │  Ports 8444, 8445 - Load balanced reads
│ Inst. │ │ Inst. │
└───────┘ └───────┘
    │
┌───▼───────────┐
│ Batch Instance│  Port 8446 - Scheduled jobs
└───────────────┘
```

### Entity Mapping

| Buffr Entity | Fineract Entity | Notes |
|--------------|-----------------|-------|
| Beneficiaries | Client | One-to-one mapping |
| Vouchers | Savings Account | Voucher product terms |
| Wallets | Savings Account | Wallet product terms |
| Trust Account | Savings Account | Separate product |
| Transactions | Transactions | All financial operations |

---

## Setup Guide

### Prerequisites

- Docker & Docker Compose
- PostgreSQL 17.0+ OR MariaDB 11.5.2+
- OpenSSL (for SSL certificates)
- UTC timezone configured

### Step 1: Environment Variables

Create `.env.local`:

```bash
# Fineract Multi-Instance Configuration
FINERACT_WRITE_URL=https://localhost:8443/fineract-provider/api/v1
FINERACT_READ_URLS=https://localhost:8444/fineract-provider/api/v1,https://localhost:8445/fineract-provider/api/v1
FINERACT_BATCH_URL=https://localhost:8446/fineract-provider/api/v1

# Fineract Credentials
FINERACT_WRITE_USERNAME=mifos
FINERACT_WRITE_PASSWORD=password
FINERACT_READ_USERNAME=mifos
FINERACT_READ_PASSWORD=password
FINERACT_BATCH_USERNAME=mifos
FINERACT_BATCH_PASSWORD=password
FINERACT_TENANT_ID=default

# Database Configuration
FINERACT_DB_NAME=fineract
FINERACT_DB_USER=fineract
FINERACT_DB_PASSWORD=your-secure-password
DB_PRIMARY_PORT=5432
DB_REPLICA_PORT=5433

# SSL Configuration
FINERACT_SERVER_SSL_ENABLED=true
SSL_CERT_TYPE=development  # or production

# Timezone (MANDATORY)
TZ=UTC
```

### Step 2: Start Fineract

**Multi-Instance Setup (Recommended):**
```bash
cd fineract
docker-compose -f docker-compose.multi-instance.yml up -d
```

**Single Instance (Development):**
```bash
cd fineract
docker-compose up -d
```

### Step 3: Verify Services

```bash
docker-compose ps
```

Check health:
```bash
curl -k https://localhost:8443/fineract-provider/api/v1/actuator/health
```

---

## Environment Variables

### Required Variables

```bash
# Fineract URLs
FINERACT_WRITE_URL=https://localhost:8443/fineract-provider/api/v1
FINERACT_READ_URLS=https://localhost:8444/fineract-provider/api/v1,https://localhost:8445/fineract-provider/api/v1
FINERACT_BATCH_URL=https://localhost:8446/fineract-provider/api/v1

# Credentials
FINERACT_WRITE_USERNAME=mifos
FINERACT_WRITE_PASSWORD=password
FINERACT_READ_USERNAME=mifos
FINERACT_READ_PASSWORD=password
FINERACT_BATCH_USERNAME=mifos
FINERACT_BATCH_PASSWORD=password
FINERACT_TENANT_ID=default

# Database
FINERACT_DB_NAME=fineract
FINERACT_DB_USER=fineract
FINERACT_DB_PASSWORD=your-password
DB_PRIMARY_PORT=5432
DB_REPLICA_PORT=5433

# Timezone (MANDATORY)
TZ=UTC
```

### SSL Configuration

```bash
# Development (Self-Signed)
FINERACT_SERVER_SSL_ENABLED=true
SSL_CERT_TYPE=development

# Production (CA-Signed)
FINERACT_SERVER_SSL_ENABLED=true
SSL_CERT_TYPE=production
SSL_CERT_PATH=/path/to/cert.pem
SSL_KEY_PATH=/path/to/key.pem
```

---

## Integration Plan

### Phase 1: Core API Integration (✅ Complete)

**Timeline:** 4 weeks  
**Status:** ✅ Complete

**Week 1-2: Setup & Validation**
- ✅ Fineract dev environment setup
- ✅ Core API testing
- ✅ Configuration validation

**Week 3-4: Integration**
- ✅ Entity mapping (Buffr → Fineract)
- ✅ Multi-instance setup
- ✅ SSL/TLS configuration
- ✅ Core API integration

### Phase 2: Custom Modules (Optional)

**Timeline:** 10 weeks  
**Status:** ⏳ Optional

**Only if needed:**
- Custom voucher module
- Custom wallet module
- Plugin architecture

---

## API Reference

### Core Endpoints

#### Clients
- `GET /api/v1/fineract/clients` - List clients
- `POST /api/v1/fineract/clients` - Create client

#### Accounts
- `GET /api/v1/fineract/accounts` - List accounts
- `POST /api/v1/fineract/accounts` - Create account

#### Wallets
- `GET /api/v1/fineract/wallets` - List wallets
- `GET /api/v1/fineract/wallets/{id}/transactions` - Wallet transactions
- `POST /api/v1/fineract/wallets/{id}/transfer` - Transfer funds
- `POST /api/v1/fineract/wallets/{id}/withdraw` - Withdraw funds
- `POST /api/v1/fineract/wallets/{id}/deposit` - Deposit funds

#### Vouchers
- `GET /api/v1/fineract/vouchers` - List vouchers
- `POST /api/v1/fineract/vouchers/{id}/redeem` - Redeem voucher

#### Reconciliation
- `GET /api/v1/fineract/reconciliation` - Reconciliation report

---

## SSL Configuration

### Development (Self-Signed)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Configure in docker-compose.yml
volumes:
  - ./cert.pem:/etc/ssl/certs/cert.pem
  - ./key.pem:/etc/ssl/private/key.pem
```

### Production (CA-Signed)

```bash
# Use Let's Encrypt or commercial CA
# Configure reverse proxy (Nginx) for SSL termination
# Internal communication via HTTP
```

---

## Multi-Instance Setup

### Architecture

- **Write Instance** (Port 8443) - All mutations
- **Read Instances** (Ports 8444, 8445) - Load balanced reads
- **Batch Instance** (Port 8446) - Scheduled jobs

### Benefits

- **Performance** - Read scaling
- **Reliability** - Fault tolerance
- **Separation** - Write/read/batch isolation

---

## 📊 Integration Status

| Phase | Status | Timeline |
|-------|--------|----------|
| **Phase 1: Core API** | ✅ Complete | 4 weeks |
| **Phase 2: Custom Modules** | ⏳ Optional | 10 weeks (if needed) |

---

## 📚 Related Documentation

- **Setup Guide:** Step-by-step setup instructions
- **Phased Integration Plan:** Detailed integration strategy
- **Multi-Instance Architecture:** Architecture details
- **SSL Configuration:** SSL/TLS setup guide
- **Environment Variables:** Complete env var reference

---

**Last Updated:** January 26, 2026  
**Status:** ✅ **Phase 1 Complete - Production Ready**
