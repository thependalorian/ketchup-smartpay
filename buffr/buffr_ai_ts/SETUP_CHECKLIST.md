# ✅ Buffr AI Backend Setup Checklist (Section 2.1.9)

This checklist helps you verify and complete the setup of the Buffr AI backend server.

## 📋 Checklist

### 1. ✅ Check Backend Server Configuration

**Status**: ✅ **COMPLETE**

- [x] `.env` file exists
- [x] `DATABASE_URL` configured (Neon PostgreSQL)
- [x] `LLM_PROVIDER` configured
- [x] `DEEPSEEK_API_KEY` configured
- [x] Dependencies installed (`node_modules` exists)

**Verification Command**:
```bash
cd buffr_ai_ts
./verify-setup.sh
```

**Expected Output**:
- ✅ .env file exists
- ✅ All required environment variables configured
- ✅ Dependencies installed

---

### 2. 🚀 Start AI Backend Server

**Status**: ⏳ **READY TO START**

**Start Development Server**:
```bash
cd buffr_ai_ts
npm run dev
```

**Expected Output**:
```
🚀 Starting Buffr AI Services...
✓ Database initialized
✅ Buffr AI running on http://0.0.0.0:8000
```

**Start Production Server**:
```bash
npm run build
npm start
```

**Verify Server is Running**:
```bash
curl http://localhost:8000/health
```

**Expected Response**:
```json
{
  "service": "Buffr AI",
  "version": "1.0.0",
  "status": "operational",
  "services": { ... }
}
```

---

### 3. 🔌 Verify Database Connection

**Status**: ⏳ **READY TO TEST**

The database connection is tested automatically when the server starts. Check the startup logs:

**Success Indicators**:
- `✓ Database initialized` in server logs
- `✓ AI database tables initialized` in server logs
- Health endpoint returns `"status": "operational"`

**Manual Database Test**:
```bash
# If server is running
curl http://localhost:8000/health | jq '.status'
```

**Troubleshooting**:
- If database connection fails, check `DATABASE_URL` in `.env`
- Ensure Neon database is active and accessible
- Check SSL mode is set correctly (`?sslmode=require`)

---

### 4. 🧪 Test API Endpoints with Real Data

**Status**: ⏳ **READY TO TEST**

**Quick Test Script**:
```bash
cd buffr_ai_ts
./test-endpoints.sh
```

**Manual Tests**:

**Health Check**:
```bash
curl http://localhost:8000/health
```

**Companion Chat**:
```bash
curl -X POST http://localhost:8000/api/companion/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What can you help me with?",
    "userId": "test-user-123"
  }'
```

**Exchange Rates**:
```bash
curl -X POST http://localhost:8000/api/scout/exchange-rates \
  -H "Content-Type: application/json" \
  -d '{
    "base_currency": "NAD",
    "target_currencies": ["USD", "EUR", "ZAR"]
  }'
```

**Fraud Detection**:
```bash
curl -X POST http://localhost:8000/api/guardian/fraud/check \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-001",
    "amount": 5000,
    "merchant_name": "Test Merchant",
    "merchant_mcc": 5411,
    "user_location": {"lat": -22.9576, "lon": 18.4904},
    "merchant_location": {"lat": -22.9576, "lon": 18.4904},
    "timestamp": "2024-01-15T10:00:00Z",
    "device_fingerprint": "test-device",
    "card_present": false
  }'
```

**Transaction Classification**:
```bash
curl -X POST http://localhost:8000/api/transaction-analyst/classify \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "test-002",
    "merchant_name": "Pick n Pay",
    "amount": 250.50,
    "merchant_mcc": 5411,
    "timestamp": "2024-01-15T10:00:00Z"
  }'
```

**Expected Results**:
- All endpoints return HTTP 200
- JSON responses with appropriate data structures
- No error messages in server logs

---

### 5. 🔗 Verify Integration with Frontend

**Status**: ⏳ **READY TO TEST**

**Frontend Client Location**: `buffr/utils/buffrAIClient.ts`

**Configuration Check**:
1. Verify frontend can reach backend:
   - Development: `http://localhost:8000/api`
   - iOS Simulator: `http://localhost:8000/api`
   - Android Emulator: `http://10.0.2.2:8000/api`
   - Physical Device: Use your computer's IP address

2. Check CORS configuration in `buffr_ai_ts/src/index.ts`:
   ```typescript
   origin: [
     'http://localhost:8081',  // Expo development
     'http://localhost:19000', // Expo web
     'http://localhost:3000',  // Next.js
   ]
   ```

**Test Frontend Integration**:
```typescript
// In your React Native app
import { buffrAI } from '@/utils/buffrAIClient';

// Test health check
const health = await buffrAI.checkHealth();
console.log('Backend health:', health);

// Test companion chat
const response = await buffrAI.chat({
  user_id: 'test-user',
  message: 'Hello!'
});
console.log('Chat response:', response);
```

**Integration Test Checklist**:
- [ ] Frontend can reach backend URL
- [ ] CORS headers allow frontend origin
- [ ] Health check endpoint works from frontend
- [ ] Companion chat endpoint works from frontend
- [ ] Error handling works correctly
- [ ] Network errors are caught and displayed

---

## 🚀 Quick Start Commands

```bash
# 1. Navigate to backend directory
cd buffr/buffr_ai_ts

# 2. Verify configuration
./verify-setup.sh

# 3. Start development server
npm run dev

# 4. In another terminal, test endpoints
./test-endpoints.sh

# 5. Test from frontend
# Open your React Native app and test the AI features
```

---

## 📊 Status Summary

| Task | Status | Notes |
|------|--------|-------|
| 1. Check backend configuration | ✅ Complete | All env vars configured |
| 2. Start backend server | ⏳ Ready | Run `npm run dev` |
| 3. Verify database connection | ⏳ Ready | Tested on server start |
| 4. Test API endpoints | ⏳ Ready | Use `./test-endpoints.sh` |
| 5. Verify frontend integration | ⏳ Ready | Test from React Native app |

---

## 🐛 Troubleshooting

### Server Won't Start
- Check `.env` file exists and has valid values
- Ensure port 8000 is not in use: `lsof -i :8000`
- Check Node.js version: `node --version` (should be 18+)

### Database Connection Fails
- Verify `DATABASE_URL` is correct
- Check Neon database is active
- Ensure SSL mode is enabled: `?sslmode=require`

### API Endpoints Return Errors
- Check server logs for detailed error messages
- Verify API keys are valid (DeepSeek, OpenAI, etc.)
- Ensure database tables are initialized

### Frontend Can't Connect
- Check CORS configuration includes frontend origin
- Verify backend URL in `buffrAIClient.ts`
- For physical devices, use computer's IP address instead of localhost

---

## 📚 Additional Resources

- **Backend README**: `buffr/buffr_ai_ts/README.md`
- **API Documentation**: See README for all available endpoints
- **Frontend Client**: `buffr/utils/buffrAIClient.ts`

---

**Last Updated**: 2024-01-17
**Status**: Ready for testing
