# 🏛️ Government Portal

**SmartPay Government Oversight Portal**

Ministry of Finance oversight portal for monitoring compliance, auditing operations, and generating reports.

---

## 🚀 Quick Start

```bash
# From monorepo root
pnpm install

# Build shared packages first
pnpm build --filter=@smartpay/*

# Start development server
pnpm dev:government

# Build for production
pnpm build:government
```

**Production URL:** https://gov.ketchup.cc
**Development:** http://localhost:5174

---

## 📁 Structure

```
government-portal/
├── src/
│   ├── components/
│   │   └── layout/            # Government layout
│   ├── pages/                 # 12 pages
│   ├── App.tsx               # Main app
│   └── main.tsx              # Entry point
├── public/
├── package.json
├── vite.config.ts
└── vercel.json
```

---

## 🎯 Features

- ✅ Compliance Monitoring (PSD-1, PSD-3, PSD-12)
- ✅ Voucher Distribution Oversight
- ✅ Beneficiary Registry (Read-Only)
- ✅ Audit Reports
- ✅ Financial Analytics
- ✅ Agent Network Monitoring
- ✅ Regional Performance
- ✅ Government Reports
- 🔒 **Read-Only Access** (monitoring and reporting only)

---

## 🔗 Dependencies

**Shared Packages:**
- `@smartpay/ui` - UI components
- `@smartpay/types` - TypeScript types
- `@smartpay/api-client` - API client
- `@smartpay/utils` - Utilities
- `@smartpay/config` - Configuration

**External:**
- React 18 + TypeScript
- Vite
- Tailwind CSS (Government theme)
- React Query
- React Router

---

## 🌐 Deployment

**Vercel:**
- Project: `smartpay-government-portal`
- Domain: `gov.smartpay-connect.com`
- CI/CD: GitHub Actions (`.github/workflows/government-portal.yml`)

**Environment Variables:**
See `.env.example` for required variables.

---

## 📝 API Endpoints

**Base URL:** `https://api.smartpay-connect.com/api/v1/government`

**Authentication:** X-API-Key header

**Access Level:** 🔒 Read-Only (GET requests only)

**Endpoints:**
- `/compliance/*` - Compliance monitoring
- `/monitoring/*` - Operations monitoring
- `/analytics/*` - Financial analytics
- `/audit/*` - Audit trails
- `/reports/*` - Report generation

---

## 🔐 Security

**Read-Only Enforcement:**
- Only GET requests allowed (except report generation)
- All access logged for audit trail
- Separate API key from Ketchup portal
- Database read-only user (future enhancement)

---

**Version:** 2.0.0  
**Status:** ✅ Production Ready  
**Access Level:** 🔒 Read-Only
