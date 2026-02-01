"""
Buffr AI - Main FastAPI Application

Production ML microservices + AI agents for Buffr Payment Companion

Services:
- ML API: Direct ML model inference endpoints
- Guardian Agent: Fraud detection & credit scoring with agent reasoning
- Transaction Analyst Agent: Spending analysis & classification with insights
"""

import os
import sys
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any
from pathlib import Path

# Add parent directory to path to allow imports when running from buffr_ai directory
current_dir = Path(__file__).parent
parent_dir = current_dir.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import uvicorn
from dotenv import load_dotenv

# Load environment first - try .env.local in parent directory (buffr root), then buffr_ai, then default
parent_env_path = Path(__file__).parent.parent / '.env.local'
local_env_path = Path(__file__).parent / '.env.local'
default_env_path = Path(__file__).parent / '.env'

# Priority: parent .env.local > local .env.local > default .env
if parent_env_path.exists():
    load_dotenv(parent_env_path, override=True)
    print(f"✓ Loaded environment from {parent_env_path}")
elif local_env_path.exists():
    load_dotenv(local_env_path, override=True)
    print(f"✓ Loaded environment from {local_env_path}")
elif default_env_path.exists():
    load_dotenv(default_env_path)
    print(f"✓ Loaded environment from {default_env_path}")
else:
    load_dotenv()  # Fallback to default .env in current directory

# Configure logging AFTER environment is loaded
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Import ML API with error handling (optional for basic functionality)
try:
    from buffr_ai.ml_api import app as ml_api_app
    ml_api_available = True
    logger.info("✓ ML API loaded")
except Exception as e:
    logger.warning(f"ML API not available (optional): {e}")
    ml_api_available = False

# Import Agents with error handling
agent_routers = {}

# Agent imports - Only agents relevant to G2P voucher platform
# Removed: scout (market intelligence), mentor (financial education), crafter (workflow automation)
# These are not relevant to government voucher distribution
agent_imports = [
    ('guardian', 'buffr_ai.agents.guardian.api', 'guardian_router'),  # Fraud detection & credit scoring
    ('transaction_analyst', 'buffr_ai.agents.transaction_analyst.api', 'transaction_analyst_router'),  # Spending analysis
    ('companion', 'buffr_ai.agents.companion.api', 'companion_router'),  # Main orchestrator
]

for agent_name, module_path, router_name in agent_imports:
    try:
        module = __import__(module_path, fromlist=[router_name])
        agent_routers[agent_name] = getattr(module, router_name)
        logger.info(f"✓ {agent_name} agent loaded")
    except Exception as e:
        logger.warning(f"{agent_name} agent not available: {e}")
        agent_routers[agent_name] = None

# Import existing RAG agent with error handling
try:
    from buffr_ai.agent.api import app as rag_api_app
    rag_available = True
    logger.info("✓ RAG agent loaded")
except Exception as e:
    logger.warning(f"RAG agent not available: {e}")
    rag_available = False

# Support functionality is now integrated into Companion Agent
# No separate support agent needed
support_available = True  # Always available via companion agent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown"""
    logger.info("🚀 Starting Buffr AI Services...")

    try:
        # Initialize ML models (optional - skip if not available)
        logger.info("Loading ML models...")
        ml_models_loaded = False

        try:
            from buffr_ai.ml.fraud_detection import load_fraud_models
            from buffr_ai.ml.credit_scoring import load_credit_models
            from buffr_ai.ml.spending_analysis import load_spending_models
            from buffr_ai.ml.transaction_classification import load_classifier

            fraud_model = await load_fraud_models()
            credit_model = await load_credit_models()
            spending_model = await load_spending_models()
            classifier = await load_classifier()

            ml_models_loaded = True
            logger.info("✓ All ML models loaded successfully")
        except Exception as e:
            logger.warning(f"ML models not available (optional): {e}")
            ml_models_loaded = False

        # Initialize database (optional for basic functionality)
        try:
            from buffr_ai.agent.db_utils import initialize_database
            await initialize_database()
            logger.info("✓ Database initialized")
        except Exception as e:
            logger.warning(f"Database initialization failed: {e}")

        # Start exchange rate scheduler (runs in background)
        try:
            from buffr_ai.services.scheduler import start_exchange_rate_scheduler
            from buffr_ai.services.exchange_rate import fetch_and_store_rates
            import asyncio
            
            start_exchange_rate_scheduler()
            logger.info("✓ Exchange rate scheduler started")
            
            # Fetch rates on startup (if limit allows) - run in background
            asyncio.create_task(fetch_and_store_rates())
            logger.info("✓ Exchange rate startup fetch initiated")
        except Exception as e:
            logger.warning(f"Exchange rate scheduler failed to start: {e}")

        logger.info("✅ Buffr AI Services ready!")
        logger.info(f"ML Models: {'Loaded' if ml_models_loaded else 'Not Available'}")

    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

    yield

    # Shutdown
    logger.info("🛑 Shutting down Buffr AI Services...")
    try:
        from buffr_ai.services.scheduler import stop_scheduler
        stop_scheduler()
        logger.info("✓ Scheduler stopped")
    except Exception as e:
        logger.warning(f"Scheduler shutdown error: {e}")
    
    try:
        from buffr_ai.agent.db_utils import close_database
        await close_database()
        logger.info("✓ Connections closed")
    except Exception as e:
        logger.error(f"Shutdown error: {e}")


# Create main application
app = FastAPI(
    title="Buffr AI - Complete ML & Agent Platform",
    description="""
    Production ML microservices and AI agents for Buffr Payment Companion.

    ## Services

    ### ML API (Direct Inference)
    - `/fraud/check` - Real-time fraud detection
    - `/credit/assess` - Credit scoring for lending
    - `/transactions/classify` - Transaction categorization
    - `/spending/analyze` - Spending pattern analysis
    - `/spending/budget` - Budget recommendations

    ### Guardian Agent (Reasoning + ML)
    - `/guardian/fraud/check` - Fraud detection with agent reasoning
    - `/guardian/credit/assess` - Credit assessment with explanations
    - `/guardian/chat` - Conversational risk assessment

    ### Transaction Analyst Agent (Insights + ML)
    - `/transaction-analyst/classify` - Transaction classification with insights
    - `/transaction-analyst/analyze` - Comprehensive spending analysis
    - `/transaction-analyst/budget` - Personalized budget generation

    ### Main Buffr AI Companion (Orchestrator) 🌟
    - `/companion/chat` - Central conversational interface
    - `/companion/multi-agent` - Multi-agent coordination
    - `/companion/context/{user_id}` - User context retrieval
    - `/companion/history/{session_id}` - Conversation history

    **Orchestrates all specialized agents for intelligent, contextual responses**

    ### RAG Agent (Knowledge Base)
    - `/chat` - Conversational AI with knowledge graph
    - `/search/*` - Vector and graph search endpoints
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Expo development
        "http://localhost:19000",  # Expo web
        "http://localhost:19006",  # Expo web alternative
        "*"  # Allow all for development (restrict in production)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include available routers
for agent_name, router in agent_routers.items():
    if router is not None:
        app.include_router(router, prefix="/api", tags=[agent_name])
    else:
        logger.warning(f"Skipping {agent_name} router - not available")

# Include Namibian Open Banking router
try:
    from buffr_ai.api.namibian_open_banking import namibian_open_banking_router
    app.include_router(namibian_open_banking_router)
    logger.info("✓ Namibian Open Banking router loaded")
except Exception as e:
    logger.warning(f"Namibian Open Banking router not available: {e}")

# Mount ML API endpoints
@app.get("/")
async def root():
    """Root endpoint with service information"""
    services_info = {}

    # ML API
    if ml_api_available:
        services_info["ml_api"] = {
            "description": "Direct ML model inference",
            "status": "available",
            "endpoints": [
                "/api/ml/fraud/check",
                "/api/ml/credit/assess",
                "/api/ml/transactions/classify",
                "/api/ml/spending/analyze"
            ]
        }

    # RAG Agent
    if rag_available:
        services_info["rag_agent"] = {
            "description": "Retrieval Augmented Generation with knowledge graphs",
            "status": "available",
            "endpoints": ["/chat", "/search/*"]
        }

    # Agent services - Only agents relevant to G2P voucher platform
    # Removed: scout, mentor, crafter (not relevant to government vouchers)
    agent_endpoints = {
        "guardian": {
            "description": "Fraud detection & credit scoring with AI reasoning",
            "endpoints": ["/api/guardian/fraud/check", "/api/guardian/credit/assess", "/api/guardian/chat"]
        },
        "transaction_analyst": {
            "description": "Spending analysis & classification with insights",
            "endpoints": ["/api/transaction-analyst/classify", "/api/transaction-analyst/analyze", "/api/transaction-analyst/budget"]
        },
        "companion": {
            "description": "Multi-agent orchestration and intelligent routing",
            "endpoints": ["/api/companion/chat", "/api/companion/multi-agent", "/api/companion/context"]
        }
    }

    for agent_name, info in agent_endpoints.items():
        if agent_routers.get(agent_name) is not None:
            services_info[f"{agent_name}_agent"] = {
                **info,
                "status": "available"
            }

    return {
        "service": "Buffr AI",
        "version": "1.0.0",
        "status": "operational",
        "services": services_info,
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc"
        },
        "timestamp": datetime.now().isoformat()
    }


@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    services_status = {
        "ml_api": "operational" if ml_api_available else "unavailable",
        "rag_agent": "operational" if rag_available else "unavailable"
    }

    # Add agent statuses
    for agent_name, router in agent_routers.items():
        services_status[f"{agent_name}_agent"] = "operational" if router is not None else "unavailable"

    return {
        "status": "healthy",
        "services": services_status,
        "timestamp": datetime.now().isoformat()
    }


# Mount ML API as sub-application with /api/ml prefix
if ml_api_available:
    try:
        # Mount the ML API app with /api/ml prefix
        # This makes endpoints available at /api/ml/fraud/check, /api/ml/credit/assess, etc.
        app.mount("/api/ml", ml_api_app)
        logger.info("✓ ML API mounted at /api/ml")
    except Exception as e:
        logger.warning(f"Failed to mount ML API: {e}")
        ml_api_available = False

# Mount RAG agent app if available
# Note: RAG agent has routes at /chat, /search/*, /documents, /sessions/{session_id}
# Mounting at root preserves the expected endpoint structure
# Note: RAG app's /health route will be available, main app's /health takes precedence for health checks
if rag_available:
    try:
        # Mount RAG app - FastAPI will handle route registration
        # Routes from mounted app are available at their defined paths
        app.mount("", rag_api_app)
        logger.info("✓ RAG agent mounted")
    except Exception as e:
        logger.warning(f"Failed to mount RAG agent: {e}")
        rag_available = False

# Support functionality is now integrated into Companion Agent
# No separate support router needed


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8001))  # Default to 8001 for Python backend
    host = os.getenv("HOST", "0.0.0.0")

    logger.info(f"Starting Buffr AI on {host}:{port}")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("ENV", "development") == "development",
        log_level="info"
    )
