# Buffr App Integration - DNS Supplement

## SmartPay Connect Namibia G2P Voucher Platform

**Version:** 1.0  
**Date:** February 1, 2026

---

## Buffr App Integration

The **Buffr** mobile app (React Native/Expo) integrates with the SmartPay Connect backend API.

### Integration Points

| Component | URL | Status |
|-----------|-----|--------|
| **Backend API** | https://api.ketchup.cc | ✓ Configured |
| **Buffr Service** | `buffr/services/ketchupSmartPayService.ts` | ✓ Updated |

### Updated Configuration

**File:** `buffr/services/ketchupSmartPayService.ts`

```typescript
// Before (old)
const KETCHUP_SMARTPAY_API_URL = process.env.KETCHUP_SMARTPAY_API_URL || 'https://api.ketchup-smartpay.com';

// After (new)
const KETCHUP_SMARTPAY_API_URL = process.env.KETCHUP_SMARTPAY_API_URL || 'https://api.ketchup.cc';
```

### Buffr Subdomain (Optional)

For a Buffr landing page, add this DNS record:

| Type | Host | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| CNAME | buffr | cname.vercel-dns.com | 1 hour | Mobile App Landing |

**URL:** https://buffr.ketchup.cc

### App Store Links (To be added)

| Platform | URL |
|----------|-----|
| Google Play | [Coming Soon] |
| Apple App Store | [Coming Soon] |

---

## All Subdomains Summary

| Subdomain | URL | Purpose | Status |
|-----------|-----|---------|--------|
| (apex) | https://ketchup.cc | Main website | ✓ |
| www | https://www.ketchup.cc | Main website | ✓ |
| buffr | https://buffr.ketchup.cc | Mobile landing | Optional |
| app | https://app.ketchup.cc | Ketchup Portal | ✓ |
| gov | https://gov.ketchup.cc | Government Portal | ✓ |
| agents | https://agents.ketchup.cc | Agent Portal | ✓ |
| api | https://api.ketchup.cc | Backend API | ✓ |
| docs | https://docs.ketchup.cc | Documentation | ✓ |
| status | https://status.ketchup.cc | Status Page | ✓ |
