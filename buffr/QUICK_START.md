# 🚀 Buffr Quick Start Guide

**Last Updated:** January 22, 2026  
**Status:** ✅ Endpoints Aligned - Ready to Use

---

## ⚠️ CRITICAL: Virtual Environment Activation

**ALWAYS activate the Python virtual environment before starting the AI backend!**

```bash
cd buffr_ai
source .venv/bin/activate  # Linux/Mac
# OR
.venv\Scripts\activate     # Windows
```

---

## 🏃 Quick Start (3 Steps)

### 1. Start Python AI Backend

```bash
# Option A: Use start script (recommended - auto-activates venv)
./scripts/start-ai-backend.sh

# Option B: Manual start
cd buffr_ai
source .venv/bin/activate  # ⚠️ CRITICAL!
python -m uvicorn main:app --port 8001
```

**Verify backend is running:**
```bash
curl http://localhost:8001/health
```

### 2. Start Next.js API (if needed)

```bash
npm run dev
# Runs on http://localhost:3000
```

### 3. Start React Native App

```bash
npm start
# Or
npx expo start
```

---

## ✅ Endpoint Alignment Status

**All frontend-backend endpoints are now aligned!**

- ✅ Base URL: `http://localhost:8001` (no `/api` suffix)
- ✅ All endpoints include `/api` prefix
- ✅ Streaming endpoint fixed
- ✅ Removed agents deprecated with helpful errors

**Test endpoints:**
```bash
./scripts/test-ai-backend.sh
```

---

## 🌐 Ketchup SmartPay (G2P vouchers)

For voucher and beneficiary sync, Buffr uses the Ketchup SmartPay API (smartpay-connect backend). Set in `.env.local`:

- `KETCHUP_SMARTPAY_API_URL` — for local dev use `http://localhost:3001` (or your smartpay-connect backend URL)
- `KETCHUP_SMARTPAY_API_KEY` — API key for SmartPay authentication

`DATABASE_URL` can be the same Neon DB as smartpay-connect (shared DB).

---

## 📚 Documentation

- **Endpoint Alignment:** `docs/FRONTEND_BACKEND_ENDPOINT_ALIGNMENT.md`
- **API Mapping:** `docs/API_ENDPOINTS_DATABASE_MAPPING.md`
- **Testing Guide:** `docs/TESTING_API_DATABASE_MAPPING.md`

---

**Remember:** Always activate venv before starting Python backend! 🐍
