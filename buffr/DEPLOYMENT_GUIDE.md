# Buffr Deployment Guide

**Project**: Buffr Payment Application  
**Last Updated**: January 28, 2026  
**Platform**: Railway (Production)

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon)
- Railway CLI (for deployment)

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret

# API URLs
API_BASE_URL=https://api.buffr.na
TOKEN_VAULT_URL=https://api.namclear.com.na/vault/v1

# Optional
NODE_ENV=production
PORT=3000
```

---

## Deployment

### Railway Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway up
```

### Cron Jobs Setup

**File**: See `CRON_SETUP.md` for detailed configuration

**Jobs**:
- Voucher expiry warnings (daily at 9 AM)
- Audit log retention (weekly)
- Inactive wallet alerts (weekly)

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL/TLS enabled
- [ ] Rate limiting configured
- [ ] Logging set up
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Error tracking enabled

---

**Status**: ✅ Deployed on Railway  
**Last Updated**: January 28, 2026
