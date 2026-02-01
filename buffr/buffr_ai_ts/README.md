# 🏦 Buffr AI - TypeScript Backend

<p align="center">
  <img src="../assets/images/buffr_logo.png" alt="Buffr Logo" width="200"/>
</p>

<p align="center">
  <strong>Multi-Agent AI Platform for Buffr Payment Companion</strong><br/>
  <em>Intelligent Financial Assistant for Namibia</em>
</p>

---

## 🌍 Overview

Buffr AI is the intelligent backend powering the Buffr payment app in Namibia. Built with TypeScript and powered by DeepSeek AI, it provides a suite of specialized AI agents that work together to deliver personalized financial assistance.

### 🏛️ Supported Namibian Banks

| Bank | Code | Description |
|------|------|-------------|
| 🔵 **Bank Windhoek** | BW | Namibia's largest locally-owned bank |
| 🟢 **FNB Namibia** | FNB | Part of FirstRand Group |
| 🔵 **Standard Bank** | SB | Leading African banking group |
| 🟢 **Nedbank** | NB | Part of Old Mutual Group |
| 🔵 **Banco Atlantico** | BA | International banking |
| 🔴 **Bank BIC** | BIC | Business banking services |
| 🟠 **Letshego Bank** | LB | Microfinance and personal loans |

---

## 🤖 AI Agents

### 🛡️ Guardian Agent
Real-time fraud detection and credit assessment using ML models.

| Endpoint | Description |
|----------|-------------|
| `POST /api/guardian/fraud/check` | Check transaction for fraud patterns |
| `POST /api/guardian/credit/assess` | Credit risk assessment |
| `POST /api/guardian/investigate` | Deep security investigation |
| `POST /api/guardian/chat` | Interactive security chat |

### 📊 Transaction Analyst Agent
Intelligent spending analysis and budget optimization.

| Endpoint | Description |
|----------|-------------|
| `POST /api/transaction-analyst/classify` | Categorize transactions |
| `POST /api/transaction-analyst/analyze` | Spending pattern analysis |
| `POST /api/transaction-analyst/budget` | Generate smart budgets |
| `POST /api/transaction-analyst/chat` | Financial insights chat |

### 🔭 Scout Agent
Market intelligence and financial data aggregation.

| Endpoint | Description |
|----------|-------------|
| `POST /api/scout/search` | Search financial news |
| `POST /api/scout/exchange-rates` | Live NAD exchange rates |
| `POST /api/scout/forecast` | Market forecasting |
| `POST /api/scout/chat` | Market intelligence chat |

### 📚 Mentor Agent
Personalized financial education and guidance.

| Endpoint | Description |
|----------|-------------|
| `POST /api/mentor/assess` | Financial literacy assessment |
| `POST /api/mentor/learning-path` | Custom learning journey |
| `POST /api/mentor/explain-concept` | Explain financial concepts |
| `POST /api/mentor/chat` | Educational chat |

### ⚙️ Crafter Agent
Workflow automation and smart financial routines.

| Endpoint | Description |
|----------|-------------|
| `POST /api/crafter/scheduled-payment` | Schedule recurring payments |
| `POST /api/crafter/spending-alert` | Smart spending alerts |
| `POST /api/crafter/automate-savings` | Automated savings rules |
| `POST /api/crafter/chat` | Automation assistant |

### 🌟 Companion Agent
Central orchestrator that intelligently routes to specialized agents.

| Endpoint | Description |
|----------|-------------|
| `POST /api/companion/chat` | Main chat interface |
| `POST /api/companion/multi-agent` | Multi-agent coordination |

### 📖 RAG Agent
Knowledge base retrieval with augmented generation.

| Endpoint | Description |
|----------|-------------|
| `POST /api/chat` | Knowledge-enhanced chat |
| `POST /api/search` | Search knowledge base |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Neon PostgreSQL** database (serverless)
- **DeepSeek API key** (primary LLM provider)

### Installation

```bash
# Navigate to the AI backend
cd buffr_ai_ts

# Install dependencies
npm install
```

### Configuration

Create a `.env` file with your credentials:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database - Neon PostgreSQL (Serverless)
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

# LLM Provider - DeepSeek (Primary)
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
LLM_MODEL=deepseek-chat

# Alternative LLM Providers (Optional)
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# Exchange Rate API (Optional - defaults to ExchangeRate Host)
# Note: ExchangeRate Host may require API key. Alternatives:
# - RatesDB: https://api.ratesdb.com/v1/latest?base=NAD (100 requests/min, no key)
# - ExchangeRate-API: https://v6.exchangerate-api.com/v6/YOUR_KEY/latest/NAD (1,500/month, free key)
EXCHANGE_RATE_API_URL=https://api.exchangerate.host/latest?base=NAD
```
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
read_file

### Run Development Server

```bash
# Start with hot-reload
npm run dev

# Server runs at http://localhost:8000
```

### Build for Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

---

## 📡 API Examples

### Chat with Companion (Main Interface)

```bash
curl -X POST http://localhost:8000/api/companion/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is my spending pattern this month?",
    "userId": "user-123"
  }'
```

### Fraud Detection

```bash
curl -X POST http://localhost:8000/api/guardian/fraud/check \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 15000,
    "merchantName": "Unknown Merchant",
    "timestamp": "2024-01-15T02:30:00Z",
    "cardPresent": false,
    "userAvgAmount": 500,
    "currency": "NAD"
  }'
```

### Credit Assessment

```bash
curl -X POST http://localhost:8000/api/guardian/credit/assess \
  -H "Content-Type: application/json" \
  -d '{
    "monthlyIncome": 25000,
    "employmentYears": 5,
    "employmentType": "permanent",
    "savingsRate": 20,
    "latePayments": 0
  }'
```

### Get Exchange Rates (NAD)

```bash
curl -X POST http://localhost:8000/api/scout/exchange-rates \
  -H "Content-Type: application/json" \
  -d '{
    "baseCurrency": "NAD",
    "targetCurrencies": ["USD", "EUR", "ZAR", "GBP"]
  }'
```

### Financial Education

```bash
curl -X POST http://localhost:8000/api/mentor/explain-concept \
  -H "Content-Type: application/json" \
  -d '{
    "concept": "compound interest",
    "userLevel": "beginner"
  }'
```

---

## 📁 Project Structure

```
buffr_ai_ts/
├── src/
│   ├── agents/
│   │   ├── companion/        # 🌟 Multi-agent orchestrator
│   │   │   ├── agent.ts
│   │   │   └── prompts.ts
│   │   ├── guardian/         # 🛡️ Fraud & credit
│   │   │   ├── agent.ts
│   │   │   └── prompts.ts
│   │   ├── transaction-analyst/  # 📊 Spending analysis
│   │   │   ├── agent.ts
│   │   │   └── prompts.ts
│   │   ├── scout/            # 🔭 Market intelligence
│   │   │   ├── agent.ts
│   │   │   └── prompts.ts
│   │   ├── mentor/           # 📚 Financial education
│   │   │   ├── agent.ts
│   │   │   └── prompts.ts
│   │   └── crafter/          # ⚙️ Workflow automation
│   │       ├── agent.ts
│   │       └── prompts.ts
│   ├── core/
│   │   ├── agent.ts          # RAG agent implementation
│   │   └── tools.ts          # Search & retrieval tools
│   ├── ml/
│   │   ├── fraud-detection.ts    # ML fraud model
│   │   └── credit-scoring.ts     # ML credit model
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   ├── utils/
│   │   ├── db.ts             # Neon PostgreSQL utilities
│   │   └── providers.ts      # LLM provider abstraction
│   └── index.ts              # Express server entry point
├── .env                      # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js 18+ with TypeScript |
| **Framework** | Express.js |
| **Database** | Neon PostgreSQL (Serverless) |
| **LLM Provider** | DeepSeek (primary), OpenAI, Anthropic |
| **Validation** | Zod |
| **Embeddings** | OpenAI text-embedding-3-small |
| **ML Models** | Rule-based (future: TensorFlow.js) |

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 8000
CMD ["node", "dist/index.js"]
```

---

## 📊 Health Check

```bash
curl http://localhost:8000/health
# Response: { "status": "ok", "agents": [...] }
```

---

## 🔐 Security

- All endpoints support rate limiting
- API key authentication available
- Secure database connections with SSL
- Input validation with Zod schemas
- CORS configuration for allowed origins

---

## 📄 License

MIT © Buffr Technologies

---

<p align="center">
  <img src="../assets/images/buffr_logo.png" alt="Buffr" width="100"/>
  <br/>
  <strong>Made with ❤️ in Namibia</strong>
</p>
