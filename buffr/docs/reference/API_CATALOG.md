# API Catalog

**Purpose**: Quick reference for all API endpoints  
**Source**: See `API_MAPPING.md` for comprehensive details  
**Last Updated**: 2026-01-17

---

## Quick Stats

- **Next.js API**: 68 files, 103 HTTP methods
- **FastAPI Backend**: 100+ endpoints
- **AI Backend**: 30+ endpoints
- **Security**: 100% coverage (all endpoints secured)

---

## Next.js API Endpoints

**Base URL**: `http://localhost:3000/api`

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users/me` - Get current user
- `PUT /api/users/me` - Update user profile
- `POST /api/users/toggle-2fa` - Toggle 2FA

### Wallets
- `GET /api/wallets` - List wallets
- `POST /api/wallets` - Create wallet
- `GET /api/wallets/[id]` - Get wallet details
- `PUT /api/wallets/[id]` - Update wallet
- `DELETE /api/wallets/[id]` - Delete wallet

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/transactions` - List all transactions
- `GET /api/admin/audit` - Get audit logs
- `GET /api/admin/ai-monitoring` - AI agent health

**Full Catalog**: See `API_MAPPING.md` for complete list

---

## FastAPI Backend Endpoints

**Base URL**: `http://localhost:8001/api/v1`

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login

### Payments
- `POST /api/v1/payments/process` - Process payment
- `GET /api/v1/payments/[id]` - Get payment status

**Full Catalog**: See `API_MAPPING.md` for complete list

---

## AI Backend Endpoints

**Base URL**: `http://localhost:8000/api`

### Agents
- `POST /api/companion/chat` - Companion Agent
- `POST /api/guardian/analyze` - Guardian Agent
- `POST /api/analyst/budget` - Transaction Analyst

**Full Catalog**: See `API_MAPPING.md` for complete list

---

## API Gateway

**Base URL**: `http://localhost:3000/api/gateway`

- `GET /api/gateway?action=health` - Health check
- `POST /api/gateway` - Proxy request to any backend

**Usage**: See `docs/backlog/API_GATEWAY_IMPLEMENTATION.md`

---

**For detailed endpoint documentation, see `API_MAPPING.md`**
