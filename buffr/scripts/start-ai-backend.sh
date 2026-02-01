#!/bin/bash

# Start Python AI Backend Script
# 
# Location: scripts/start-ai-backend.sh
# Purpose: Start Python AI backend with proper venv activation
# 
# Usage:
#   ./scripts/start-ai-backend.sh
#   OR
#   chmod +x scripts/start-ai-backend.sh && ./scripts/start-ai-backend.sh

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Buffr AI Backend (Python FastAPI)${NC}"
echo ""

# Navigate to buffr_ai directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
AI_BACKEND_DIR="$PROJECT_ROOT/buffr_ai"

if [ ! -d "$AI_BACKEND_DIR" ]; then
    echo -e "${RED}❌ Error: buffr_ai directory not found at $AI_BACKEND_DIR${NC}"
    exit 1
fi

cd "$AI_BACKEND_DIR"

# Load environment variables from parent .env.local if it exists
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    echo -e "${GREEN}📋 Loading environment variables from .env.local...${NC}"
    # Use a safe method to load env vars (handle special characters)
    set -a
    source <(grep -v '^#' "$PROJECT_ROOT/.env.local" | grep -v '^$' | sed 's/^/export /' 2>/dev/null || true)
    set +a
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
    echo ""
fi

# Check if venv exists
if [ ! -d ".venv" ]; then
    echo -e "${YELLOW}⚠️  Virtual environment not found. Creating one...${NC}"
    python3 -m venv .venv
    echo -e "${GREEN}✅ Virtual environment created${NC}"
fi

# Activate virtual environment
echo -e "${GREEN}📦 Activating virtual environment...${NC}"
source .venv/bin/activate

# Check if dependencies are installed
if [ ! -f ".venv/bin/uvicorn" ]; then
    echo -e "${YELLOW}⚠️  Dependencies not installed. Installing...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Check for required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$NEON_CONNECTION_STRING" ]; then
    echo -e "${YELLOW}⚠️  Warning: DATABASE_URL not set${NC}"
    echo "   Set it in .env.local or export it:"
    echo "   export DATABASE_URL='postgresql://...'"
fi

if [ -z "$DEEPSEEK_API_KEY" ] && [ -z "$LLM_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Warning: DEEPSEEK_API_KEY not set${NC}"
    echo "   Set it in .env.local or export it:"
    echo "   export DEEPSEEK_API_KEY='...'"
fi

# Start the server
echo ""
echo -e "${GREEN}✅ Starting FastAPI server on port 8001...${NC}"
echo -e "${GREEN}   Backend URL: http://localhost:8001${NC}"
echo -e "${GREEN}   Health Check: http://localhost:8001/health${NC}"
echo -e "${GREEN}   API Docs: http://localhost:8001/docs${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
echo ""

# Run uvicorn
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
