# Apache Fineract - Buffr Integration Guide

**Location**: `buffr/fineract/`  
**Purpose**: Integration guide for Apache Fineract core banking system with Buffr G2P Voucher Platform

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Fineract Structure](#fineract-structure)
3. [Configuration Files](#configuration-files)
4. [Database Setup](#database-setup)
5. [Authentication & API Access](#authentication--api-access)
6. [Integration Architecture](#integration-architecture)
7. [Buffr Service Integration](#buffr-service-integration)
8. [Environment Variables](#environment-variables)
9. [Docker Setup](#docker-setup)
10. [API Endpoints Reference](#api-endpoints-reference)

---

## Overview

Apache Fineract is a **core banking platform** that provides:
- Client (beneficiary) management
- Account management (Savings, Current, Loan accounts)
- Transaction processing
- Trust account management
- Multi-tenant architecture

### Dual Database Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BUFFR APPLICATION                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  Neon PostgreSQL     │      │  Fineract Database  │    │
│  │  (Application Data)  │      │  (Core Banking)      │    │
│  ├──────────────────────┤      ├──────────────────────┤    │
│  │ • users              │      │ • m_clients          │    │
│  │ • vouchers           │      │ • m_savings_account  │    │
│  │ • wallets            │      │ • m_loan             │    │
│  │ • transactions       │      │ • m_transaction      │    │
│  │ • analytics          │      │ • trust_account      │    │
│  └──────────────────────┘      └──────────────────────┘    │
│           │                              │                    │
│           └──────────┬───────────────────┘                   │
│                      │                                         │
│           ┌──────────▼──────────┐                            │
│           │  FineractService    │                            │
│           │  (Sync Layer)       │                            │
│           └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Fineract Structure

### Key Directories

```
fineract/
├── fineract-provider/          # Main API server (Spring Boot)
│   ├── src/main/resources/
│   │   └── application.properties  # Main configuration
│   └── build/libs/
│       └── fineract-provider.jar    # Executable JAR
│
├── fineract-client/             # Client management module
├── fineract-savings/            # Savings account module
├── fineract-loan/               # Loan management module
├── fineract-accounting/         # Accounting module
│
├── config/docker/               # Docker configuration
│   ├── env/
│   │   ├── fineract.env
│   │   ├── fineract-common.env
│   │   ├── fineract-postgresql.env
│   │   └── postgresql.env
│   └── compose/
│       ├── fineract.yml
│       └── postgresql.yml
│
├── docker-compose-postgresql.yml  # Docker Compose for PostgreSQL
├── docker-compose-development.yml # Development setup
│
├── fineract-db/                 # Database scripts
│   └── mifospltaform-tenants-first-time-install.sql
│
└── setup-fineract-buffr.sh      # Buffr setup script
```

### Module Breakdown

| Module | Purpose | Key Features |
|--------|---------|--------------|
| **fineract-provider** | Main API server | REST API, authentication, tenant management |
| **fineract-client** | Client management | Create/update clients, KYC data |
| **fineract-savings** | Savings accounts | Account creation, deposits, withdrawals |
| **fineract-loan** | Loan management | Loan products, disbursements, repayments |
| **fineract-accounting** | Accounting | Journal entries, GL accounts |
| **fineract-core** | Core functionality | Shared services, utilities |

---

## Configuration Files

### 1. Main Application Properties

**Location**: `fineract-provider/src/main/resources/application.properties`

**Key Settings**:
```properties
# Security
fineract.security.basicauth.enabled=true
fineract.security.oauth2.enabled=false
fineract.security.2fa.enabled=false

# Tenant Configuration
fineract.tenant.identifier=default
fineract.tenant.name=fineract_default
fineract.tenant.host=localhost
fineract.tenant.port=3306
fineract.tenant.username=root
fineract.tenant.password=mysql
fineract.tenant.master-password=fineract

# Database Connection Pool
fineract.hikari.minimum-idle=3
fineract.hikari.maximum-pool-size=10
```

### 2. Docker Environment Files

**Location**: `config/docker/env/`

#### `fineract-postgresql.env`
```bash
FINERACT_HIKARI_DRIVER_SOURCE_CLASS_NAME=org.postgresql.Driver
FINERACT_HIKARI_JDBC_URL=jdbc:postgresql://db:5432/fineract_tenants
FINERACT_HIKARI_USERNAME=postgres
FINERACT_HIKARI_PASSWORD=skdcnwauicn2ucnaecasdsajdnizucawencascdca
```

#### `fineract-common.env`
```bash
FINERACT_DEFAULT_TENANTDB_IDENTIFIER=default
FINERACT_DEFAULT_TENANTDB_NAME=fineract_default
FINERACT_DEFAULT_TENANTDB_HOSTNAME=db
FINERACT_DEFAULT_MASTER_PASSWORD=fineract
```

#### `postgresql.env`
```bash
POSTGRES_USER=root
POSTGRES_PASSWORD=skdcnwauicn2ucnaecasdsajdnizucawencascdca
FINERACT_TENANTS_DB_NAME=fineract_tenants
FINERACT_TENANT_DEFAULT_DB_NAME=fineract_default
```

---

## Database Setup

### Fineract Database Structure

Fineract uses a **multi-tenant architecture**:

1. **Tenants Database** (`fineract_tenants`):
   - Stores tenant metadata
   - Manages tenant configuration
   - One database for all tenants

2. **Tenant Databases** (`fineract_default`, etc.):
   - One database per tenant
   - Stores all client, account, transaction data
   - Isolated data per tenant

### Database Creation

```bash
# Create tenants database
./gradlew createDB -PdbName=fineract_tenants

# Create default tenant database
./gradlew createDB -PdbName=fineract_default
```

### Key Tables (in tenant database)

| Table | Purpose |
|-------|---------|
| `m_client` | Client (beneficiary) records |
| `m_savings_account` | Savings accounts |
| `m_loan` | Loan accounts |
| `m_transaction` | All transactions |
| `m_gl_account` | Chart of accounts |
| `m_office` | Organization structure |

---

## Authentication & API Access

### Default Credentials

```
Username: mifos
Password: password
Tenant: default
```

### Authentication Methods

#### 1. Basic Authentication (Default)

```http
GET /fineract-provider/api/v1/clients
Authorization: Basic bWlmb3M6cGFzc3dvcmQ=
X-Fineract-Platform-TenantId: default
```

**Note**: `bWlmb3M6cGFzc3dvcmQ=` is base64 of `mifos:password`

#### 2. OAuth2 (Optional)

Configured in `application.properties`:
```properties
fineract.security.oauth2.enabled=true
fineract.security.oauth2.client.registrations.frontend-client.client-id=frontend-client
```

### API Base URL

```
Development: https://localhost:8443/fineract-provider/api/v1
Production: https://api.fineract.yourdomain.com/fineract-provider/api/v1
```

### Required Headers

```http
Authorization: Basic <base64(username:password)>
X-Fineract-Platform-TenantId: default
Content-Type: application/json
```

---

## Integration Architecture

### Buffr ↔ Fineract Integration Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BUFFR APPLICATION                         │
│                                                              │
│  1. User creates account in Buffr                           │
│     ↓                                                        │
│  2. FineractService.createClient()                          │
│     ↓                                                        │
│  3. Client created in Fineract                              │
│     ↓                                                        │
│  4. FineractService.createAccount()                        │
│     ↓                                                        │
│  5. Savings account created in Fineract                     │
│     ↓                                                        │
│  6. Sync status logged in fineract_sync_logs                │
└─────────────────────────────────────────────────────────────┘
```

### Transaction Sync Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Voucher Redemption Transaction                             │
│                                                              │
│  1. User redeems voucher                                    │
│     ↓                                                        │
│  2. Transaction created in Buffr DB                         │
│     ↓                                                        │
│  3. FineractService.syncTransaction()                      │
│     ↓                                                        │
│  4. Transaction created in Fineract                         │
│     ↓                                                        │
│  5. Balance updated in both systems                         │
│     ↓                                                        │
│  6. Reconciliation check (optional)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Buffr Service Integration

### Current Implementation

**File**: `buffr/services/fineractService.ts`

**Key Methods**:
- `createClient()` - Create beneficiary in Fineract
- `getClientByExternalId()` - Get client by Buffr user ID
- `createAccount()` - Create savings/current account
- `getAccountBalance()` - Get account balance
- `createTransaction()` - Create transaction
- `syncTransaction()` - Sync transaction with logging
- `reconcileTrustAccount()` - Reconcile trust account

### API Endpoints Created

1. **`/api/fineract/clients`** (GET, POST)
   - Get or create clients in Fineract

2. **`/api/fineract/accounts`** (GET, POST)
   - Get or create accounts in Fineract

3. **`/api/fineract/transactions`** (POST)
   - Sync transactions to Fineract

4. **`/api/fineract/reconciliation`** (POST)
   - Reconcile trust account

---

## Environment Variables

### Required for Buffr Integration

Add to `buffr/.env.local`:

```bash
# Fineract API Configuration
FINERACT_API_URL=https://localhost:8443/fineract-provider/api/v1
FINERACT_API_KEY=  # For OAuth2 (if enabled)
FINERACT_TENANT_ID=default
FINERACT_USERNAME=mifos
FINERACT_PASSWORD=password

# Fineract Database (for direct queries if needed)
FINERACT_DB_HOST=localhost
FINERACT_DB_PORT=5432
FINERACT_DB_NAME=fineract_default
FINERACT_DB_USER=postgres
FINERACT_DB_PASSWORD=skdcnwauicn2ucnaecasdsajdnizucawencascdca
```

### Docker Environment Variables

**Location**: `fineract/config/docker/env/fineract-postgresql.env`

```bash
# Update these for production
FINERACT_HIKARI_PASSWORD=<secure-password>
FINERACT_DEFAULT_TENANTDB_PWD=<secure-password>
POSTGRES_PASSWORD=<secure-password>
```

---

## Docker Setup

### Quick Start (Using Setup Script)

```bash
cd buffr/fineract
chmod +x setup-fineract-buffr.sh
./setup-fineract-buffr.sh
```

### Manual Docker Setup

#### 1. Start PostgreSQL Database

```bash
cd buffr/fineract
docker-compose -f docker-compose-postgresql.yml up -d
```

#### 2. Create Databases

```bash
./gradlew createDB -PdbName=fineract_tenants
./gradlew createDB -PdbName=fineract_default
```

#### 3. Build Fineract

```bash
./gradlew :fineract-provider:bootJar
```

#### 4. Run Fineract

```bash
java -jar fineract-provider/build/libs/fineract-provider.jar
```

### Docker Compose (Full Stack)

```bash
docker-compose -f docker-compose-postgresql.yml up -d
```

**Services**:
- PostgreSQL: `localhost:5432`
- Fineract API: `https://localhost:8443`

---

## API Endpoints Reference

### Fineract REST API

#### Base URL
```
https://localhost:8443/fineract-provider/api/v1
```

#### Authentication
```http
Authorization: Basic <base64(username:password)>
X-Fineract-Platform-TenantId: default
```

### Key Endpoints

#### 1. Clients

**Create Client**
```http
POST /clients
Content-Type: application/json

{
  "firstname": "John",
  "lastname": "Doe",
  "mobileNo": "+264811234567",
  "dateOfBirth": "1990-01-01",
  "externalId": "buffr_user_123"
}
```

**Get Client by External ID**
```http
GET /clients?externalId=buffr_user_123
```

#### 2. Savings Accounts

**Create Savings Account**
```http
POST /clients/{clientId}/savingsaccounts
Content-Type: application/json

{
  "productId": 1,
  "submittedDate": "2026-01-23"
}
```

**Get Account Balance**
```http
GET /savingsaccounts/{accountId}
```

#### 3. Transactions

**Create Deposit**
```http
POST /savingsaccounts/{accountId}/transactions
Content-Type: application/json

{
  "transactionDate": "2026-01-23",
  "transactionType": "Deposit",
  "amount": 1000.00,
  "paymentTypeId": 1,
  "note": "Voucher redemption"
}
```

**Create Withdrawal**
```http
POST /savingsaccounts/{accountId}/transactions
Content-Type: application/json

{
  "transactionDate": "2026-01-23",
  "transactionType": "Withdrawal",
  "amount": 500.00,
  "paymentTypeId": 1,
  "note": "Cash-out"
}
```

### Buffr API Endpoints

#### 1. Create Client in Fineract
```http
POST /api/fineract/clients
Authorization: Bearer <buffr-token>

{
  "firstname": "John",
  "lastname": "Doe",
  "mobileNo": "+264811234567",
  "dateOfBirth": "1990-01-01",
  "externalId": "buffr_user_123"
}
```

#### 2. Create Account
```http
POST /api/fineract/accounts
Authorization: Bearer <buffr-token>

{
  "userId": "buffr_user_123",
  "accountType": "SAVINGS"
}
```

#### 3. Sync Transaction
```http
POST /api/fineract/transactions
Authorization: Bearer <buffr-token>

{
  "transactionId": "txn_123",
  "userId": "buffr_user_123",
  "transactionType": "CREDIT",
  "amount": 1000.00,
  "currency": "NAD",
  "reference": "voucher_redemption_123",
  "description": "Voucher redemption"
}
```

#### 4. Reconcile Trust Account
```http
POST /api/fineract/reconciliation
Authorization: Bearer <buffr-admin-token>

{
  "trustAccountId": 1
}
```

---

## Trust Account Reconciliation

### Purpose

Reconcile the trust account balance between:
- **Fineract**: Core banking system (source of truth)
- **Buffr Application**: Application database

### Process

1. Get balance from Fineract
2. Get balance from Buffr application
3. Compare balances
4. Log discrepancies
5. Alert if difference > threshold

### Implementation

**File**: `buffr/app/api/fineract/reconciliation/route.ts`

**Compliance**: PSD-3 (Trust account reconciliation)

---

## Security Considerations

### 1. Authentication

- **Basic Auth**: Default (username/password)
- **OAuth2**: Optional (configure in `application.properties`)
- **2FA**: Can be enabled (`fineract.security.2fa.enabled=true`)

### 2. SSL/TLS

- Fineract runs on HTTPS by default (`https://localhost:8443`)
- Self-signed certificate in development
- Use proper SSL certificate in production

### 3. API Keys

- Store `FINERACT_API_KEY` in environment variables
- Never commit credentials to version control
- Use secure password management

### 4. Database Security

- Use strong passwords for database
- Enable SSL for database connections
- Restrict database access to application servers only

---

## Troubleshooting

### Common Issues

#### 1. Connection Refused

**Error**: `Connection refused to localhost:8443`

**Solution**:
- Check if Fineract is running: `docker ps`
- Check logs: `docker logs fineract`
- Verify port 8443 is not in use

#### 2. Authentication Failed

**Error**: `401 Unauthorized`

**Solution**:
- Verify username/password: `mifos:password`
- Check tenant ID: `default`
- Verify base64 encoding of credentials

#### 3. Database Connection Error

**Error**: `Cannot connect to database`

**Solution**:
- Check PostgreSQL is running: `docker ps`
- Verify database credentials in `config/docker/env/postgresql.env`
- Check database exists: `./gradlew createDB -PdbName=fineract_tenants`

#### 4. Tenant Not Found

**Error**: `Tenant not found`

**Solution**:
- Create default tenant database: `./gradlew createDB -PdbName=fineract_default`
- Verify tenant configuration in `fineract-common.env`

---

## Next Steps

1. **Configure Environment Variables**
   - Update `buffr/.env.local` with Fineract credentials
   - Update `fineract/config/docker/env/*.env` for production

2. **Start Fineract**
   - Run `./setup-fineract-buffr.sh` or use Docker Compose

3. **Test Integration**
   - Create a test client via `/api/fineract/clients`
   - Create a test account via `/api/fineract/accounts`
   - Sync a test transaction via `/api/fineract/transactions`

4. **Production Deployment**
   - Use proper SSL certificates
   - Configure strong passwords
   - Set up monitoring and logging
   - Configure backup strategy

---

## Additional Resources

- **Fineract Documentation**: https://fineract.apache.org/docs/current/
- **Fineract API Swagger**: `https://localhost:8443/fineract-provider/swagger-ui/index.html`
- **Fineract Community**: https://fineract.apache.org/#contribute
- **Buffr Integration Service**: `buffr/services/fineractService.ts`
- **Buffr API Endpoints**: `buffr/app/api/fineract/`

---

**Last Updated**: 2026-01-23  
**Maintained By**: Buffr Development Team
