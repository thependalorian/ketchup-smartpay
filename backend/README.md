# SmartPay Connect Backend API

## Overview

Modular backend architecture for SmartPay Connect, aligned with PRD requirements.

## Architecture

```
backend/
├── src/
│   ├── api/              # API Gateway
│   │   ├── routes/       # REST endpoints
│   │   └── middleware/  # Auth, rate limiting, validation
│   ├── services/         # Service Layer (PRD Components)
│   │   ├── beneficiary/  # Beneficiary Database
│   │   ├── voucher/      # Voucher Generator
│   │   ├── distribution/ # Distribution Engine
│   │   ├── status/       # Status Monitor
│   │   └── agent/       # Agent Network (agents table from run.ts; map: GET /api/v1/map/locations)
│   ├── database/        # Database layer
│   └── utils/           # Utilities
└── package.json
```

## Services (PRD Components)

### 1. Beneficiary Service
- **Location:** `src/services/beneficiary/`
- **Files:** `BeneficiaryService.ts`, `BeneficiaryRepository.ts`
- **API:** `/api/v1/beneficiaries`

### 2. Voucher Generator Service
- **Location:** `src/services/voucher/`
- **Files:** `VoucherGenerator.ts`, `VoucherService.ts`, `VoucherRepository.ts`
- **API:** `/api/v1/vouchers`

### 3. Distribution Engine
- **Location:** `src/services/distribution/`
- **Files:** `DistributionEngine.ts`, `BuffrAPIClient.ts`
- **API:** `/api/v1/distribution`

### 4. Status Monitor
- **Location:** `src/services/status/`
- **Files:** `StatusMonitor.ts`
- **API:** `/api/v1/webhooks`

### 5. Agent Service
- **Location:** `src/services/agents/`
- **Database:** `agents` table created by `run.ts` (008)
- **API:** `/api/v1/agents`, `GET /api/v1/map/locations` (agents → MapLocation for ketchup-portal map)

## Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Run migrations and seed:
```bash
pnpm run migrate   # Creates shared tables; see MIGRATION_ORDER.md for Buffr/G2P
pnpm run seed      # Seeds agents, beneficiaries, status_events
```
See [MIGRATION_ORDER.md](./MIGRATION_ORDER.md) for shared DB with Buffr/G2P.

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Beneficiaries
- `GET /api/v1/beneficiaries` - List beneficiaries
- `GET /api/v1/beneficiaries/:id` - Get beneficiary
- `POST /api/v1/beneficiaries` - Create beneficiary
- `PUT /api/v1/beneficiaries/:id` - Update beneficiary
- `GET/POST /api/v1/beneficiaries/:id/dependants` - List/create dependants
- `GET/PATCH/DELETE /api/v1/beneficiaries/:id/dependants/:dependantId` - Get/update/delete dependant

### Vouchers
- `GET /api/v1/vouchers` - List vouchers
- `GET /api/v1/vouchers/:id` - Get voucher
- `POST /api/v1/vouchers` - Issue voucher
- `POST /api/v1/vouchers/batch` - Issue batch vouchers
- `PUT /api/v1/vouchers/:id/status` - Update voucher status

### Distribution
- `POST /api/v1/distribution/disburse` - Distribute voucher to Buffr
- `POST /api/v1/distribution/batch` - Batch distribution

### Webhooks
- `POST /api/v1/webhooks/buffr` - Receive Buffr webhooks

### Map (Ketchup Portal)
- `GET /api/v1/map/locations` - Agent locations for map (latitude, longitude, region)

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3001)
- `BUFFR_API_URL` - Buffr API endpoint
- `BUFFR_API_KEY` - Buffr API key
- `API_KEY` - API key for authentication

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

### Validation

- `pnpm run validate` – validate seed (table counts).
- `pnpm run validate:audit` – validate government audit beneficiaries query (same SELECT as `GET /api/v1/government/audit/beneficiaries`); asserts response shape and numeric fields. Requires `DATABASE_URL`.
