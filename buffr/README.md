# Buffr - Mobile Payment Application

**Version**: 2.0  
**Last Updated**: January 28, 2026  
**Status**: 🟢 **Production Ready**

---

## 📱 Overview

Buffr is a comprehensive mobile payment application for Namibia, featuring:

- 💰 **G2P Vouchers** - Government-to-Person digital vouchers
- 💳 **Mobile Wallets** - Multi-currency wallet management
- 🏪 **Merchant Payments** - NAMQR v5.0 QR code payments
- 🏦 **Open Banking** - Bank account integration (Namibian Open Banking v1.0)
- 🎯 **Agent Network** - Cash-in/cash-out services
- 📊 **Analytics** - Spending insights and budgeting

---

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/buffr.git

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values
# For local Ketchup SmartPay, set KETCHUP_SMARTPAY_API_URL=http://localhost:3001 (or your smartpay-connect backend URL)

# Run migrations
npm run migrate

# Start development server
npm start
```

### First Steps

1. **Read** [QUICK_START.md](./QUICK_START.md) for detailed setup
2. **Configure** environment variables (see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md))
3. **Run** database migrations: `npm run migrate`
4. **Start** the app: `npm start`

---

## 📚 Documentation

### Core Guides

| Guide | Description |
|-------|-------------|
| **[DATABASE_GUIDE.md](./DATABASE_GUIDE.md)** | 🗄️ Complete database documentation (216 tables) |
| **[API_GUIDE.md](./API_GUIDE.md)** | 🔌 REST API endpoints and integration |
| **[SECURITY_GUIDE.md](./SECURITY_GUIDE.md)** | 🔒 Security, compliance, and production readiness |
| **[DESIGN_GUIDE.md](./DESIGN_GUIDE.md)** | 🎨 Design system and UI components |
| **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** | 🚢 Deployment to Railway and setup |
| **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** | 🧪 Testing strategy and examples |

### Additional Resources

| Resource | Description |
|----------|-------------|
| **[Integration with SmartPay Connect](../smartpay-connect/backend/INTEGRATION.md)** | Shared backend, DB, migration order (buffr, g2p, smartpay-connect) |
| **[QUICK_START.md](./QUICK_START.md)** | Quick setup guide |
| **[CHANGELOG.md](./CHANGELOG.md)** | Version history |
| **[BUFFR_PIVOT_G2P_VOUCHERS.md](./BUFFR_PIVOT_G2P_VOUCHERS.md)** | G2P pivot strategy (465K) |
| **[docs/](./docs/)** | Additional technical documentation |

---

## 🏗️ Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React Native + Expo |
| **Backend** | Next.js 14 (API Routes) |
| **Database** | Neon PostgreSQL (216 tables) |
| **Authentication** | JWT + 2FA |
| **Payments** | NAMQR v5.0, Open Banking v1.0 |
| **Deployment** | Railway (Production) |

Buffr is a beneficiary/agent app; it uses the **Ketchup SmartPay API** (smartpay-connect backend) for vouchers and beneficiaries and can share the same Neon DB. For local dev, point `KETCHUP_SMARTPAY_API_URL` at the backend (e.g. `http://localhost:3001`).

### System Architecture

```
┌──────────────┐
│  Mobile App  │ (React Native + Expo)
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐
│  API Layer   │ (Next.js API Routes)
└──────┬───────┘
       │
   ┌───┴────────────┬──────────────┬──────────────┐
   ▼                ▼              ▼              ▼
┌────────┐    ┌──────────┐  ┌──────────┐  ┌──────────┐
│Database│    │ Services │  │  NAMQR   │  │  Open    │
│(Neon)  │    │ Layer    │  │  System  │  │  Banking │
└────────┘    └──────────┘  └──────────┘  └──────────┘
```

---

## ⚡ Features

### Core Features

| Feature | Status | Documentation |
|---------|--------|---------------|
| **G2P Vouchers** | ✅ Complete | [BUFFR_PIVOT_G2P_VOUCHERS.md](./BUFFR_PIVOT_G2P_VOUCHERS.md) |
| **Mobile Wallets** | ✅ Complete | [API_GUIDE.md](./API_GUIDE.md) |
| **NAMQR Payments** | ✅ Complete | [DATABASE_GUIDE.md](./DATABASE_GUIDE.md#token-vault-parameters) |
| **Open Banking** | ✅ Complete | [docs/NAMIBIAN_OPEN_BANKING_QUICK_START.md](./docs/NAMIBIAN_OPEN_BANKING_QUICK_START.md) |
| **Agent Network** | ✅ Complete | [API_GUIDE.md](./API_GUIDE.md) |
| **2FA Security** | ✅ Complete | [SECURITY_GUIDE.md](./SECURITY_GUIDE.md#authentication) |
| **Analytics** | ✅ Complete | [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) |

### Advanced Features

- ✅ Multi-currency support (NAD, USD, EUR, ZAR)
- ✅ Savings wallets with interest
- ✅ Bill payments
- ✅ Split bills
- ✅ USSD integration
- ✅ Gamification (achievements, leaderboards)
- ✅ Real-time notifications

---

## 🗄️ Database

**Provider**: Neon PostgreSQL (Serverless)  
**Tables**: 216 (shared with g2p project)  
**Migrations**: 43 migration files

**Key Tables**:
- `users` - User accounts
- `wallets` - Mobile wallets
- `vouchers` - G2P vouchers
- `transactions` - All transactions
- `token_vault_parameters` - NAMQR QR storage
- `merchants` - Merchant accounts
- `agents` - Agent network

See [DATABASE_GUIDE.md](./DATABASE_GUIDE.md) for complete schema documentation.

---

## 🔐 Security

### Implemented

- ✅ Multi-factor authentication (2FA)
- ✅ JWT token authentication
- ✅ Role-based access control (RBAC)
- ✅ Data encryption (AES-256)
- ✅ HTTPS/TLS everywhere
- ✅ Rate limiting
- ✅ Input validation
- ✅ Audit logging (7-year retention)

### Compliance

- ✅ **PSD-1**: Payment Service Provider Licensing
- ✅ **PSD-3**: Electronic Money Issuance
- ✅ **PSD-12**: Cybersecurity Standards
- ✅ **NAMQR v5.0**: QR Code Standards
- ✅ **Open Banking v1.0**: API Standards

See [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for complete security documentation.

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

**Coverage**: 65% (in progress)

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing strategy.

---

## 🚢 Deployment

**Platform**: Railway (Production)

```bash
# Deploy to Railway
railway up

# Run migrations
npm run migrate
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment guide.

---

## 📊 Project Stats

| Metric | Value |
|--------|-------|
| **Total Files** | ~600 |
| **Lines of Code** | ~50,000 |
| **Database Tables** | 216 |
| **API Endpoints** | 50+ |
| **Components** | 147 |
| **Services** | 19 |
| **Tests** | 28 |

---

## 🛠️ NPM Scripts

```bash
# Development
npm start              # Start Expo development server
npm run dev           # Alias for npm start
npm run dev:ios       # Start iOS development
npm run dev:android   # Start Android development

# Building
npm run build         # Export for web
npm run build:ios     # Export for iOS
npm run build:android # Export for Android

# Database
npm run migrate       # Run database migrations

# Testing
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Code Quality
npm run lint          # Run TypeScript linter
```

---

## 📁 Project Structure

```
buffr/
├── app/                    # Next.js API routes & screens
│   ├── (tabs)/            # Main app tabs
│   ├── api/               # API endpoints
│   └── ...                # Other screens
├── components/            # React components (147)
├── services/              # Business logic (19)
├── utils/                 # Utilities (74)
├── contexts/              # React contexts (10)
├── types/                 # TypeScript types (6)
├── sql/                   # Database migrations (43)
├── docs/                  # Documentation
├── __tests__/             # Test files (28)
└── ...                    # Config files
```

---

## 🤝 Contributing

1. Read [QUICK_START.md](./QUICK_START.md) for setup
2. Review [DESIGN_GUIDE.md](./DESIGN_GUIDE.md) for UI guidelines
3. Check [TESTING_GUIDE.md](./TESTING_GUIDE.md) for testing standards
4. Follow [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for security best practices

---

## 📖 Related Projects

- **[g2p](../g2p/)** - G2P voucher system (shares database)
- **[buffr_ai](./buffr_ai/)** - AI/ML components (Python)
- **[buffr_ai_ts](./buffr_ai_ts/)** - AI/ML components (TypeScript)
- **[fineract](./fineract/)** - Apache Fineract integration

---

## 📞 Support

**Documentation**: See guides above  
**Issues**: GitHub Issues  
**Email**: support@buffr.na

---

## 📝 License

Proprietary - All rights reserved

---

**Project Status**: 🟢 **Production Ready** (95%)  
**Last Updated**: January 28, 2026  
**Version**: 2.0

---

## 🎯 Next Steps

1. **Get Started**: Read [QUICK_START.md](./QUICK_START.md)
2. **Database**: Review [DATABASE_GUIDE.md](./DATABASE_GUIDE.md)
3. **API**: Check [API_GUIDE.md](./API_GUIDE.md)
4. **Deploy**: Follow [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
5. **Secure**: Implement [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) best practices
