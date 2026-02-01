# Integration Guide: buffr, g2p, and smartpay-connect

This document explains how the three projects work together and how to set them up for development.

## Architecture Overview

| Project | Type | Purpose |
|---------|------|---------|
| **smartpay-connect** | Backend (Express) + Portals (Vite) | Ketchup SmartPay API - voucher lifecycle, beneficiaries, agents, distribution, reconciliation, webhooks |
| **buffr** | Expo App + API Routes | Beneficiary/agent mobile app - voucher disbursement, wallet management, external integrations (Fineract, NamPost, USSD) |
| **g2p** | Expo App + API Routes | Alternative beneficiary/agent mobile app - same conceptual flows as buffr |

## Data Flow

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   smartpay-connect  │     │       buffr         │     │        g2p          │
│     (Backend)       │     │    (Mobile App)     │     │    (Mobile App)     │
└─────────┬───────────┘     └──────────┬──────────┘     └──────────┬──────────┘
          │                           │                           │
          │    VITE_API_URL           │                           │
          │    /api/v1/ketchup        │                           │
          │◄──────────────────────────┤                           │
          │                           │                           │
          │    BUFFR_API_URL          │    KETCHUP_SMARTPAY_      │
          │    POST .../disburse      │    API_URL               │
          ├──────────────────────────►│◄──────────────────────────┤
          │                           │                           │
          │        DATABASE_URL (shared Neon database)            │
          └───────────────────────────────────────────────────────┘
```

## Shared Database Schema

All three projects share the same PostgreSQL database (via Neon). **Single entry point:** from `smartpay-connect/backend` run `pnpm run migrate`. The `run.ts` script creates beneficiaries, beneficiary_dependants, vouchers, status_events, webhook_events, reconciliation_records, and agents (beneficiaries include proxy_* and deceased_at). See [MIGRATION_ORDER.md](./MIGRATION_ORDER.md). Buffr may add extra tables (wallets, agent_liquidity_logs, etc.) with `IF NOT EXISTS` in its own SQL migrations.

## Environment Variables

### smartpay-connect (Backend)
- `DATABASE_URL` - PostgreSQL connection string (shared)
- `VITE_API_URL` - Portal → Backend URL (e.g., `http://localhost:3001`)
- `BUFFR_API_URL` - URL of the Buffr app when backend pushes disbursements (e.g. Expo dev server or deployed Buffr API)
- `BUFFR_API_KEY` - API key for Buffr authentication

### buffr / g2p (Mobile Apps)
- `KETCHUP_SMARTPAY_API_URL` - Point to smartpay-connect backend
  - **Production:** `https://api.ketchup.cc`
  - **Development:** `http://localhost:3001` (or your local backend URL)
- `KETCHUP_SMARTPAY_API_KEY` - API key for SmartPay authentication
- `DATABASE_URL` - PostgreSQL connection (shared with smartpay-connect)

## Setting Up for Development

### 1. Start smartpay-connect Backend
```bash
cd smartpay-connect/backend
cp .env.example .env.local  # if needed
# Edit .env.local with your DATABASE_URL
pnpm install
pnpm run dev  # Starts on port 3001
```

### 2. Run Migrations and Seed Development Data
```bash
cd smartpay-connect/backend
pnpm run migrate  # Creates beneficiaries, beneficiary_dependants, vouchers, status_events, webhook_events, reconciliation_records, agents
pnpm run seed     # Seeds agents, beneficiaries, status_events (see scripts/seed.ts)
```

### 3. Start buffr App
```bash
cd buffr
cp .env.example .env.local  # Created from audit fixes
# Edit .env.local:
#   KETCHUP_SMARTPAY_API_URL=http://localhost:3001
#   DATABASE_URL=same as backend
pnpm install
pnpm start
```

### 4. Start g2p App
```bash
cd g2p
cp .env.example .env.local
# Edit .env.local:
#   KETCHUP_SMARTPAY_API_URL=http://localhost:3001
#   DATABASE_URL=same as backend
pnpm install
pnpm start
```

## Integration Points

| From | To | Endpoint | Purpose |
|------|-----|----------|---------|
| ketchup-portal | smartpay-connect | `POST /api/v1/ketchup/...` | Voucher management |
| government-portal | smartpay-connect | `POST /api/v1/government/...` | Government reporting |
| smartpay-connect | buffr | `POST /api/utilities/vouchers/disburse` | Push vouchers to buffr |
| buffr | smartpay-connect | `KETCHUP_SMARTPAY_API_URL` | Beneficiary/voucher sync |
| g2p | smartpay-connect | `KETCHUP_SMARTPAY_API_URL` | Beneficiary/voucher sync |

## Migration Order

When setting up a fresh database:

**Recommended:** From `smartpay-connect/backend` run `pnpm run migrate` then `pnpm run seed`. This creates beneficiaries, beneficiary_dependants, vouchers, status_events, webhook_events, reconciliation_records, and agents. If you also use the Buffr schema (wallets, etc.), run SmartPay migrate first, then Buffr SQL migrations. See [MIGRATION_ORDER.md](./MIGRATION_ORDER.md). Do not run 001–007 SQL files by hand; `run.ts` applies the needed logic.

## Troubleshooting

### "agents table not found"
`run.ts` creates the `agents` table (008). If it’s missing, run `pnpm run migrate` from `smartpay-connect/backend`.

### "voucher_id UUID mismatch"
The `status_events` table uses `VARCHAR(100)` for `voucher_id`. Do not use `UUID` type.

### KETCHUP_SMARTPAY_API_URL not connecting
For local development, ensure:
1. smartpay-connect backend is running on port 3001
2. buffr/g2p `.env.local` has `KETCHUP_SMARTPAY_API_URL=http://localhost:3001`
3. CORS is configured to allow the app's origin
