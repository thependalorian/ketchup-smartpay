# Buffr AI Backend (Python FastAPI)

**Location:** `buffr_ai/`  
**Port:** 8001  
**Framework:** FastAPI (Python)  
**Status:** ✅ Active - Primary AI Backend

---

## ⚠️ CRITICAL: Virtual Environment Activation

**You MUST activate the virtual environment before running the backend!**

```bash
# Navigate to buffr_ai directory
cd buffr_ai

# Activate virtual environment
source .venv/bin/activate  # Linux/Mac
# OR
.venv\Scripts\activate     # Windows

# Verify activation (you should see (.venv) in your prompt)
which python  # Should show .venv/bin/python
```

---

## 🚀 Quick Start

### Option 1: Use Start Script (Recommended)

From project root:
```bash
./scripts/start-ai-backend.sh
```

This script:
- ✅ Automatically activates venv
- ✅ Checks dependencies
- ✅ Validates environment variables
- ✅ Starts the server

### Option 2: Manual Start

```bash
cd buffr_ai
source .venv/bin/activate  # ⚠️ CRITICAL: Activate venv!
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

---

## 📋 Prerequisites

1. **Python 3.11+**
2. **Virtual Environment** (`.venv` directory)
3. **Environment Variables** (`.env.local` file)

### Create Virtual Environment (First Time)

```bash
cd buffr_ai
python3 -m venv .venv
source .venv/bin/activate  # Linux/Mac
# OR
.venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt
```

### Environment Variables

Create `.env.local` in `buffr_ai/` directory:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/db

# DeepSeek AI (Primary LLM)
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat

# Embeddings
EMBEDDING_API_KEY=your_key_here
EMBEDDING_BASE_URL=https://api.deepseek.com/v1

# Neo4j (Optional - for knowledge graph)
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=your_password
```

---

## 🧪 Testing

### Test All Endpoints

```bash
# From project root
./scripts/test-ai-backend.sh
```

### Test Specific Endpoint

```bash
# Health check
curl http://localhost:8001/health

# Companion chat
curl -X POST http://localhost:8001/api/companion/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "user_id": "test-user"}'
```

---

## 📡 API Endpoints

### Core Endpoints

- `GET /` - Service information
- `GET /health` - Health check

### Guardian Agent (Fraud & Credit)

- `POST /api/guardian/fraud/check` - Fraud detection
- `POST /api/guardian/credit/assess` - Credit scoring
- `POST /api/guardian/chat` - Security chat
- `GET /api/guardian/health` - Agent health

### Transaction Analyst Agent

- `POST /api/transaction-analyst/classify` - Classify transactions
- `POST /api/transaction-analyst/analyze` - Spending analysis
- `POST /api/transaction-analyst/budget` - Budget recommendations
- `POST /api/transaction-analyst/chat` - Financial insights
- `GET /api/transaction-analyst/health` - Agent health

### Companion Agent (Orchestrator)

- `POST /api/companion/chat` - Main chat interface
- `POST /api/companion/chat/stream` - Streaming chat (SSE)
- `POST /api/companion/multi-agent` - Multi-agent coordination
- `GET /api/companion/context/{user_id}` - User context
- `GET /api/companion/history/{session_id}` - Conversation history
- `GET /api/companion/health` - Agent health

### ML API (Direct Model Inference)

- `POST /api/ml/fraud/check` - Direct fraud ML inference
- `POST /api/ml/credit/assess` - Direct credit ML inference
- `POST /api/ml/transactions/classify` - Direct classification
- `POST /api/ml/spending/analyze` - Direct spending analysis

### RAG Agent (Knowledge Base)

- `POST /chat` - Knowledge-enhanced chat
- `POST /chat/simple` - Simple chat (no RAG)
- `POST /chat/stream` - Streaming chat
- `POST /search/vector` - Vector search
- `POST /search/graph` - Graph search (Neo4j)
- `POST /search/hybrid` - Hybrid search
- `GET /documents` - List documents
- `GET /sessions/{session_id}` - Session details

---

## 🔧 Configuration

### LLM Provider

**DeepSeek (Primary - Cost-Effective):**
```env
DEEPSEEK_API_KEY=your_key
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

**Note:** OpenAI and Anthropic models are explicitly excluded. Only DeepSeek is supported.

### Database

**Neon PostgreSQL (Serverless):**
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require
```

---

## 📊 Active Agents

| Agent | Purpose | Endpoints |
|-------|---------|-----------|
| 🛡️ Guardian | Fraud detection & credit scoring | `/api/guardian/*` |
| 📊 Transaction Analyst | Spending analysis & classification | `/api/transaction-analyst/*` |
| 🌟 Companion | Multi-agent orchestration | `/api/companion/*` |
| 📖 RAG | Knowledge base retrieval | `/chat`, `/search/*` |

### Removed Agents (Not Relevant to G2P Vouchers)

- ❌ Scout Agent (Market Intelligence)
- ❌ Mentor Agent (Financial Education)
- ❌ Crafter Agent (Workflow Automation - TypeScript backend only)

---

## 🐛 Troubleshooting

### Backend Won't Start

**Problem:** `ModuleNotFoundError` or import errors

**Solution:**
```bash
# Make sure venv is activated
source .venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Port Already in Use

**Problem:** `Address already in use`

**Solution:**
```bash
# Find process using port 8001
lsof -i :8001  # Mac/Linux
netstat -ano | findstr :8001  # Windows

# Kill the process or use different port
python -m uvicorn main:app --port 8002
```

### Database Connection Failed

**Problem:** `Connection refused` or `timeout`

**Solution:**
1. Check `DATABASE_URL` in `.env.local`
2. Verify database is accessible
3. Check SSL mode: `?sslmode=require`

### Missing API Keys

**Problem:** `DEEPSEEK_API_KEY not set`

**Solution:**
1. Create `.env.local` in `buffr_ai/` directory
2. Add: `DEEPSEEK_API_KEY=your_key_here`
3. Restart backend

---

## 📚 Documentation

- **API Endpoints Mapping:** `../docs/API_ENDPOINTS_DATABASE_MAPPING.md`
- **Endpoint Alignment:** `../docs/FRONTEND_BACKEND_ENDPOINT_ALIGNMENT.md`
- **Testing Guide:** `../docs/TESTING_API_DATABASE_MAPPING.md`
- **Migration Progress:** `../docs/AI_BACKEND_MIGRATION_PROGRESS.md`

---

## 🔗 Related Files

- `main.py` - FastAPI application entry point
- `requirements.txt` - Python dependencies
- `agents/` - AI agent implementations
- `ml/` - ML model implementations
- `services/` - Background services (scheduler, exchange rates)

---

**Remember:** Always activate venv before starting! 🐍

```bash
source .venv/bin/activate  # ⚠️ CRITICAL!
```
