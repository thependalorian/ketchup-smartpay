# 🏪 Ketchup Portal

**SmartPay Ketchup Operations Portal**

Operations portal for Ketchup Solutions staff to manage beneficiaries, vouchers, agents, and distributions.

---

## 🚀 Quick Start

```bash
# From monorepo root
pnpm install

# Build shared packages first
pnpm build --filter=@smartpay/*

# Start development server
pnpm dev:ketchup

# Build for production
pnpm build:ketchup
```

**Production URL:** https://www.ketchup.cc
**Development:** http://localhost:5173

---

## 📁 Structure

```
ketchup-portal/
├── src/
│   ├── components/
│   │   ├── dashboard/        # Dashboard widgets
│   │   └── layout/            # Layout components
│   ├── pages/                 # 17 pages
│   ├── App.tsx               # Main app (no ProfileContext)
│   └── main.tsx              # Entry point
├── public/
├── package.json
├── vite.config.ts
└── vercel.json
```

---

## 🎯 Features

- ✅ Beneficiary Management (CRUD)
- ✅ Voucher Distribution
- ✅ Batch Processing
- ✅ Status Monitoring
- ✅ Webhook Monitoring
- ✅ Reconciliation
- ✅ Agent Network Management
- ✅ Regional Analytics
- ✅ Open Banking Integration
- ✅ Reports Generation

---

## 🔗 Dependencies

**Shared Packages:**
- `@smartpay/ui` - UI components (51 components)
- `@smartpay/types` - TypeScript types
- `@smartpay/api-client` - API client
- `@smartpay/utils` - Utilities
- `@smartpay/config` - Configuration

**External:**
- React 18 + TypeScript
- Vite
- Tailwind CSS + DaisyUI
- React Query
- React Router

---

## 🌐 Deployment

**Vercel:**
- Project: `smartpay-ketchup-portal`
- Domain: `app.ketchup.cc`
- CI/CD: GitHub Actions (`.github/workflows/ketchup-portal.yml`)

**Environment Variables:**
See `.env.example` for required variables.

---

## 📝 API Endpoints

**Base URL:** `https://api.ketchup.cc/api/v1/ketchup`

**Authentication:** X-API-Key header

**Endpoints:**
- `/beneficiaries` - Full CRUD
- `/vouchers` - Full CRUD
- `/distribution` - Create and monitor
- `/agents` - Full CRUD
- `/reconciliation` - Operations
- `/webhooks` - Event handling

---

**Version:** 2.0.0  
**Status:** ✅ Production Ready
