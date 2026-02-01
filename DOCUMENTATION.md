# 📚 SMARTPAY CONNECT - COMPLETE DOCUMENTATION

**All-in-one documentation for SmartPay Connect**

---

## 🎯 Quick Navigation

- [Getting Started](#getting-started)
- [System Overview](#system-overview)
- [Database Documentation](#database-documentation)
- [PSD Compliance](#psd-compliance)
- [Open Banking](#open-banking)
- [API Reference](#api-reference)
- [Development Guide](#development-guide)

---

## 🚀 Getting Started

### Prerequisites
```bash
Node.js >= 18
npm >= 9
PostgreSQL (Neon)
```

### Installation
```bash
# Install dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Setup environment
cp backend/.env.local.bak backend/.env.local
```

### Run the Application
```bash
# Development mode (runs both frontend + backend)
npm run dev

# Backend only (from backend folder)
cd backend && npm run dev

# Frontend only (from root)
npm run dev
```

### Access Points
```
**Production:**
- Frontend:    https://www.ketchup.cc
- API:         https://api.ketchup.cc
- Government:  https://gov.ketchup.cc

**Development:**
- Frontend:    http://localhost:5173
- Backend API: http://localhost:3001
- Compliance:  http://localhost:5173/compliance
```

---

## 📊 System Overview

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS + DaisyUI for styling
- React Query for data fetching
- React Router for navigation

**Backend:**
- Node.js with Express
- TypeScript
- Neon PostgreSQL (serverless)
- `tsx watch` for development

**Database:**
- Neon PostgreSQL (Serverless), shared with Buffr schema (agents, wallets, etc.) and SmartPay tables (beneficiaries, vouchers, status_events, webhook_events, reconciliation_records). Migration entry point: from `backend` run `pnpm run migrate` (see [backend/MIGRATION_ORDER.md](backend/MIGRATION_ORDER.md)).

**Integration:** Buffr and G2P mobile apps call this backend via `KETCHUP_SMARTPAY_API_URL` for beneficiaries, vouchers, and verification; the backend pushes disbursements to Buffr via `BUFFR_API_URL`.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SMARTPAY CONNECT                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Frontend   │  │   Backend    │  │   Database   │ │
│  │   React +    │◄─┤   Express +  │◄─┤     Neon     │ │
│  │   Vite       │  │   TypeScript │  │  PostgreSQL  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                    CORE MODULES                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  • Beneficiary Management    • Voucher Distribution    │
│  • Agent Network             • Transaction Processing  │
│  • E-Wallet System           • Liquidity Management    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│               REGULATORY COMPLIANCE                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  • PSD-1: Payment Service Provider Licensing           │
│  • PSD-3: Electronic Money Issuance                    │
│  • PSD-12: Operational & Cybersecurity Standards       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  OPEN BANKING                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  • OAuth 2.0 Authorization   • Account Information (AIS)│
│  • Payment Initiation (PIS)  • Consent Management      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                  GAMIFICATION                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  • Achievements (5 rarities) • Battle Pass System      │
│  • Daily Challenges          • Leaderboards            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Statistics

```
Total Tables:             216
PSD Compliance Tables:     14
Open Banking Tables:      ~30
Core System Tables:       ~50
Gamification Tables:      ~25
AI/Analytics Tables:      ~20

Total API Routes:        ~100
Backend Services:         ~40
Frontend Components:     ~60
```

---

## 🗄️ Database Documentation

### Connection Details

```env
DATABASE_URL=postgresql://neondb_owner:npg_B7JHyg6PlIvX@ep-rough-frog-ad0dg5fe-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### Database Categories

**Core Business (50 tables):**
- `beneficiaries` - Customer data (104,582 records)
- `agents` - Agent network (487 active)
- `vouchers` - Distribution tracking
- `transactions` - Payment records
- `wallets` - E-wallet system

**PSD Compliance (14 tables):**
- `trust_account_reconciliation` - Daily 100% coverage
- `two_factor_auth_logs` - 2FA tracking
- `system_uptime_logs` - 99.9% monitoring
- `cybersecurity_incidents` - 24h reporting
- `dormant_wallets` - 6-month tracking
- `capital_requirements_tracking` - N$1.5M tracking
- `bon_monthly_reports` - Monthly reports

**Open Banking (30 tables):**
- `oauth_clients` - TPP registration
- `oauth_access_tokens` - Token management
- `consents` - User permissions
- `accounts` - Account Information (AIS)
- `payment_initiations` - Payment Initiation (PIS)

### Common Queries

**Check Compliance Status:**
```sql
SELECT * FROM compliance_dashboard_metrics 
WHERE metric_date = CURRENT_DATE;
```

**Get Active Beneficiaries:**
```sql
SELECT * FROM beneficiaries 
WHERE status = 'active' 
ORDER BY region;
```

**View System Uptime:**
```sql
SELECT * FROM system_availability_summary 
WHERE summary_date = CURRENT_DATE;
```

---

## 🏛️ PSD Compliance

### Overview

SmartPay Connect is **100% compliant** with Namibian Payment System Determinations:

- ✅ **PSD-1:** Payment Service Provider Licensing
- ✅ **PSD-3:** Electronic Money Issuance
- ✅ **PSD-12:** Operational & Cybersecurity Standards

### PSD-3: Electronic Money Requirements

**Trust Account Management:**
```
Requirement: 100% coverage of e-money liabilities
Implementation: trust_account_reconciliation
Frequency: Daily at 00:00
Status: AUTOMATED ✅
```

**Capital Requirements:**
```
Initial Capital: N$1,500,000 (required)
Ongoing Capital: 2% of 6-month avg outstanding liabilities
Implementation: capital_requirements_tracking
Frequency: Daily at 02:00
Status: AUTOMATED ✅
```

**Dormant Wallet Management:**
```
Inactivity Period: 6 months
Notification: 1 month before dormancy
Implementation: dormant_wallets
Frequency: Daily at 01:00
Status: AUTOMATED ✅
```

**Monthly Reporting to BoN:**
```
Due Date: 10th of following month
Recipient: assessments.npsd@bon.com.na
Implementation: bon_monthly_reports
Frequency: 1st of each month at 00:00
Status: AUTOMATED ✅
```

### PSD-12: Cybersecurity Standards

**System Uptime:**
```
Requirement: 99.9% availability
Implementation: system_uptime_logs
Frequency: Every 5 minutes
Status: AUTOMATED ✅
```

**Two-Factor Authentication:**
```
Requirement: All payment transactions
Implementation: two_factor_auth_logs
Method: SMS OTP (SHA-256 hashed)
Expiry: 5 minutes
Max Attempts: 3
Status: ACTIVE ✅
```

**Incident Response:**
```
Requirement: 24-hour preliminary report to BoN
Implementation: cybersecurity_incidents
Notification: Immediate to assessments.npsd@bon.com.na
Impact Assessment: Within 30 days
Status: ACTIVE ✅
```

**Backup & Recovery:**
```
Recovery Time Objective (RTO): 2 hours
Recovery Point Objective (RPO): 5 minutes
Implementation: backup_recovery_logs
Frequency: Daily full backups
Status: AUTOMATED ✅
```

### PSD-1: Agent Reporting

**Annual Agent Returns (Table 1):**
```
Due Date: January 31 annually
Recipient: assessments.npsd@bon.com.na
Implementation: agent_annual_returns
Data: Agent details, services, transaction volumes
Status: AUTOMATED ✅
```

### Automated Compliance Tasks

**Daily (00:00 - 02:00):**
- Trust account reconciliation
- Dormancy checks
- Capital tracking

**Continuous (Every 5 minutes):**
- System uptime monitoring
- Service health checks

**Monthly (1st of month):**
- BoN report generation
- Monthly metrics compilation

**On-Demand:**
- 2FA for every payment
- Incident logging and reporting

### Compliance Dashboard

Access: `http://localhost:5173/compliance`

**Real-time metrics:**
- Overall compliance score (0-100%)
- Trust account status
- Capital compliance
- System uptime (99.9% target)
- Open incidents
- Pending reports

---

## 🌐 Open Banking

### Namibian Open Banking Standards v1.0

SmartPay Connect implements the complete Namibian Open Banking Standards:

**Implemented Services:**
- ✅ Account Information Services (AIS)
- ✅ Payment Initiation Services (PIS)
- ✅ Card-Based Payment Instruments (CBPII)

### OAuth 2.0 Authorization

**Flow:**
```
1. TPP registration → oauth_clients
2. User consent → consents
3. Authorization code → oauth_authorization_codes (PKCE)
4. Access token → oauth_access_tokens
5. Refresh token → Long-lived token
```

**Security:**
- PKCE (Proof Key for Code Exchange)
- State parameter for CSRF protection
- JWT tokens with expiry
- Refresh token rotation

### Account Information Services (AIS)

**Endpoints:**
```
GET /api/v1/open-banking/accounts
GET /api/v1/open-banking/accounts/{accountId}
GET /api/v1/open-banking/accounts/{accountId}/transactions
GET /api/v1/open-banking/accounts/{accountId}/balances
```

**Consent Required:**
- Explicit user authorization
- Scope-based permissions
- Time-limited access
- Revocable by user

### Payment Initiation Services (PIS)

**Endpoints:**
```
POST /api/v1/open-banking/payment-initiations
GET  /api/v1/open-banking/payment-initiations/{paymentId}
POST /api/v1/open-banking/payment-initiations/{paymentId}/authorize
```

**Security:**
- Strong Customer Authentication (SCA)
- Transaction signing
- Amount confirmation
- Beneficiary verification

### Participant Management

**Types:**
- Third-Party Providers (TPPs)
- Account Information Service Providers (AISPs)
- Payment Initiation Service Providers (PISPs)
- Data Providers

**Registration:**
```
POST /api/v1/open-banking/participants
```

### Consent Management

**Lifecycle:**
```
1. Request consent (TPP)
2. User authorization
3. Consent granted
4. Active period
5. Expiry or revocation
```

**User Control:**
- View all active consents
- Revoke any consent instantly
- Audit consent history
- Permission management

---

## 🔌 API Reference

### Base URLs

```
Backend API:  http://localhost:3001/api/v1
Open Banking: http://localhost:3001/api/v1/open-banking
Compliance:   http://localhost:3001/api/v1/compliance
```

### Authentication

**API Key (Backend):**
```bash
curl -H "X-API-Key: smartpay_721f7f67..." \
  http://localhost:3001/api/v1/beneficiaries
```

**OAuth 2.0 (Open Banking):**
```bash
curl -H "Authorization: Bearer {access_token}" \
  http://localhost:3001/api/v1/open-banking/accounts
```

### Core Endpoints

**Beneficiaries:**
```
GET    /api/v1/beneficiaries
GET    /api/v1/beneficiaries/:id
POST   /api/v1/beneficiaries
PUT    /api/v1/beneficiaries/:id
DELETE /api/v1/beneficiaries/:id
```

**Agents:**
```
GET    /api/v1/agents
GET    /api/v1/agents/:id
POST   /api/v1/agents
PUT    /api/v1/agents/:id
GET    /api/v1/agents/:id/performance
```

**Vouchers:**
```
GET    /api/v1/vouchers
POST   /api/v1/vouchers/distribute
GET    /api/v1/vouchers/:id/status
POST   /api/v1/vouchers/:id/redeem
```

**Transactions:**
```
GET    /api/v1/transactions
GET    /api/v1/transactions/:id
POST   /api/v1/transactions
```

### Compliance Endpoints

**Dashboard:**
```
GET /api/v1/compliance/dashboard
```

**Trust Account:**
```
POST /api/v1/compliance/trust-account/reconcile
GET  /api/v1/compliance/trust-account/status
```

**2FA:**
```
POST /api/v1/compliance/2fa/generate-otp
POST /api/v1/compliance/2fa/verify-otp
```

**System Uptime:**
```
GET  /api/v1/compliance/uptime/status
POST /api/v1/compliance/uptime/log
```

**BoN Reports:**
```
POST /api/v1/compliance/bon-reports/generate
GET  /api/v1/compliance/bon-reports/{reportId}
GET  /api/v1/compliance/bon-reports/pending
```

---

## 💻 Development Guide

### Project Structure

```
smartpay-connect/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── layout/             # Layout components
│   │   └── profile/            # Profile components
│   ├── pages/                  # Page components
│   ├── services/               # API services
│   ├── contexts/               # React contexts
│   └── types/                  # TypeScript types
├── backend/                     # Backend source
│   ├── src/
│   │   ├── api/               # API routes
│   │   │   ├── routes/       # Route handlers
│   │   │   └── middleware/   # Express middleware
│   │   ├── services/         # Business logic
│   │   │   ├── compliance/  # PSD compliance services
│   │   │   ├── distribution/# Distribution engine
│   │   │   └── webhook/     # Webhook handlers
│   │   ├── database/        # Database layer
│   │   │   ├── migrations/  # SQL migrations
│   │   │   └── connection.ts
│   │   ├── schedulers/      # Automated tasks
│   │   └── utils/           # Utilities
│   └── test-*.ts            # Test suites
├── shared/                     # Shared types
│   └── types/
└── public/                     # Static assets
```

### Running Tests

**Backend Tests:**
```bash
cd backend

# PSD Compliance tests (24 tests)
npx tsx test-psd-compliance.ts

# Webhook tests
npx tsx test-webhooks.ts
```

### Database Migrations

**Run migrations:**
```bash
cd backend
DATABASE_URL="..." npx tsx src/database/migrations/run.ts
```

**Create new migration:**
```bash
# Create file: backend/src/database/migrations/008_your_migration.sql
# Add SQL statements
# Run migrations
```

### Adding New Features

**1. Database changes:**
```sql
-- Create migration file
-- Add tables, indexes, constraints
```

**2. Backend service:**
```typescript
// Create service in backend/src/services/
export class MyService {
  static async myMethod() {
    const result = await sql`SELECT ...`;
    return result;
  }
}
```

**3. API route:**
```typescript
// Add route in backend/src/api/routes/
router.get('/my-endpoint', async (req, res) => {
  const data = await MyService.myMethod();
  res.json(data);
});
```

**4. Frontend service:**
```typescript
// Add service in src/services/
export const fetchMyData = async () => {
  const response = await fetch('/api/v1/my-endpoint');
  return response.json();
};
```

**5. Frontend component:**
```tsx
// Create component in src/components/
export const MyComponent = () => {
  const { data } = useQuery(['myData'], fetchMyData);
  return <div>{data}</div>;
};
```

### Code Standards

**Follow the 23 coding rules:**
1. Use DaisyUI for UI components
2. Create modular components
3. Document all components
4. Ensure Vercel compatibility
5. Design scalable endpoints
6. Use async operations
7. Document API responses
8. Use Neon serverless driver
9. Maintain existing functionality
10. Comprehensive error handling
11. Optimize for speed
12. Complete code verification
13. Use TypeScript
14. Ensure security
15. Include error checks
16. Protect endpoints
17. Secure database access
18. Step-by-step planning
19. Use specified tech stack
20. Consistent styling
21. Specify file changes
22. Organize components properly
23. Efficient communication

---

## 🎯 Key Features

### Beneficiary Management
- 104,582 registered beneficiaries
- Regional distribution tracking
- Grant type management
- Status monitoring

### Agent Network
- 487 active agents
- Liquidity management
- Geographic clustering
- Performance tracking
- Commission calculations

### Voucher Distribution
- Batch distribution
- Status tracking
- Redemption management
- Agent-assisted cashout

### E-Wallet System
- Real-time balances
- Transaction history
- P2P transfers
- Cash in/out operations

### Regulatory Compliance
- Automated daily reconciliation
- Real-time monitoring
- Automated reporting
- Audit trail

### Open Banking
- OAuth 2.0 integration
- Account information access
- Payment initiation
- Consent management

### Gamification
- 5 rarity levels (common → legendary)
- 6 achievement categories
- Battle pass system
- Daily challenges
- Leaderboards

---

## 🔐 Security

### Database Security
- SSL/TLS encryption required
- Parameterized queries (SQL injection prevention)
- Connection pooling with Neon
- Automated backups

### API Security
- API key authentication
- Rate limiting
- CORS configuration
- OAuth 2.0 for Open Banking

### Compliance Security
- 2FA for all payments
- Incident tracking
- Audit logging
- Data encryption

---

## 📞 Support

### Common Issues

**Database connection failed:**
```bash
# Check environment variables
cat backend/.env.local

# Test connection
cd backend && DATABASE_URL="..." npx tsx -e "import {neon} from '@neondatabase/serverless'; const sql=neon(process.env.DATABASE_URL!); console.log(await sql\`SELECT NOW()\`);"
```

**Backend not starting:**
```bash
# Check port availability
lsof -i :3001

# View logs
cd backend && npm run dev
```

**Frontend not loading:**
```bash
# Check port availability
lsof -i :5173

# Rebuild
npm run build
npm run dev
```

### Contact

**Bank of Namibia (PSD Compliance):**
- Email: assessments.npsd@bon.com.na
- Preliminary reports: Within 24 hours
- Impact assessments: Within 30 days
- Monthly reports: By 10th of following month
- Annual returns: By January 31

---

## 📈 Performance

### Database Performance
- ~800 indexes for optimization
- Connection pooling via Neon
- Automated query optimization
- Estimated storage: ~130 GB

### API Performance
- Average response time: <200ms
- Caching strategy implemented
- Async operations for heavy tasks
- Rate limiting for protection

### System Availability
- Target: 99.9% uptime
- Monitoring: Every 5 minutes
- Automated alerts
- RTO: 2 hours, RPO: 5 minutes

---

## 🎉 Summary

**SmartPay Connect is a production-ready payment platform with:**

✅ **216 database tables** covering all business needs  
✅ **100% PSD compliance** (PSD-1, PSD-3, PSD-12)  
✅ **Full Open Banking** implementation (Namibian v1.0)  
✅ **Automated compliance** (daily, hourly, monthly tasks)  
✅ **Secure architecture** (SSL, 2FA, OAuth 2.0)  
✅ **Scalable infrastructure** (Neon serverless, auto-scaling)  
✅ **Comprehensive API** (~100 endpoints)  
✅ **Modern frontend** (React, TypeScript, TailwindCSS)

**Status:** ✅ Production Ready  
**Last Updated:** January 28, 2026  
**Documentation Version:** 2.0 (Consolidated)

---

**📖 For more details, see archived documentation in `/docs/archive/`**
