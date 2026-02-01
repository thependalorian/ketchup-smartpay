"""
Scout Agent - FastAPI Endpoints
"""

import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from .agent import run_scout_agent, ScoutDependencies
from .models import (
    SearchRequest,
    SearchResponse,
    SearchResult,
    ExchangeRateRequest,
    ExchangeRateResponse,
    ForecastRequest,
    ForecastResponse,
    PricingAnalysisRequest,
    PricingAnalysisResponse,
    RegulatoryUpdateRequest,
    RegulatoryUpdateResponse,
    SpendingOpportunitiesRequest,
    SpendingOpportunitiesResponse,
    ScoutAgentResponse
)
from .tools import (
    search_namibian_financial_info,
    get_bon_exchange_rates,
    forecast_spending_trend,
    analyze_merchant_pricing,
    get_regulatory_updates,
    identify_spending_opportunities
)
from .db_utils import get_db_pool

logger = logging.getLogger(__name__)

# Create router
scout_router = APIRouter(
    prefix="/scout",
    tags=["Scout Agent"]
)


@scout_router.post("/search", response_model=SearchResponse)
async def search_namibian_finance(request: SearchRequest):
    """
    Search for information from Namibian financial institutions

    Searches: Bank of Namibia, NAMFISA, Ministry of Finance, NSX, Commercial Banks
    """
    try:
        from pydantic_ai import RunContext

        # Create mock context for tool execution
        deps = ScoutDependencies(session_id="api_search", user_id=None)
        ctx = type('Context', (), {'deps': deps})()

        results = await search_namibian_financial_info(
            ctx,
            query=request.query,
            max_results=request.max_results
        )

        return SearchResponse(
            query=request.query,
            results=[SearchResult(**r) for r in results],
            result_count=len(results)
        )

    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@scout_router.post("/exchange-rates", response_model=ExchangeRateResponse)
async def get_exchange_rates(request: ExchangeRateRequest):
    """
    Get current NAD exchange rates from Bank of Namibia
    """
    try:
        from pydantic_ai import RunContext

        deps = ScoutDependencies(session_id="api_rates", user_id=None)
        ctx = type('Context', (), {'deps': deps})()

        result = await get_bon_exchange_rates(ctx)

        return ExchangeRateResponse(
            base_currency=request.base_currency,
            rates=result['rates'],
            last_updated=datetime.fromisoformat(result['last_updated']),
            source=result['source']
        )

    except Exception as e:
        logger.error(f"Exchange rates fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@scout_router.post("/forecast", response_model=ForecastResponse)
async def forecast_spending(request: ForecastRequest):
    """
    Forecast future spending trends using time series analysis
    """
    try:
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()
        deps = ScoutDependencies(session_id="api_forecast", user_id=request.user_id, db_pool=db_pool)
        ctx = type('Context', (), {'deps': deps})()

        result = await forecast_spending_trend(
            ctx,
            user_id=request.user_id,
            forecast_days=request.forecast_days
        )

        return ForecastResponse(**result)

    except Exception as e:
        logger.error(f"Forecast failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@scout_router.post("/pricing", response_model=PricingAnalysisResponse)
async def analyze_pricing(request: PricingAnalysisRequest):
    """
    Analyze merchant pricing trends by category
    """
    try:
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()
        deps = ScoutDependencies(session_id="api_pricing", db_pool=db_pool)
        ctx = type('Context', (), {'deps': deps})()

        result = await analyze_merchant_pricing(
            ctx,
            merchant_category=request.merchant_category,
            location=request.location
        )

        return PricingAnalysisResponse(**result)

    except Exception as e:
        logger.error(f"Pricing analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@scout_router.post("/regulatory-updates", response_model=RegulatoryUpdateResponse)
async def get_updates(request: RegulatoryUpdateRequest):
    """
    Get latest regulatory updates from NAMFISA and Ministry of Finance
    """
    try:
        from pydantic_ai import RunContext

        deps = ScoutDependencies(session_id="api_regulatory")
        ctx = type('Context', (), {'deps': deps})()

        results = await get_regulatory_updates(
            ctx,
            topic=request.topic
        )

        return RegulatoryUpdateResponse(
            updates=[SearchResult(**r) for r in results],
            count=len(results)
        )

    except Exception as e:
        logger.error(f"Regulatory updates fetch failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@scout_router.post("/opportunities", response_model=SpendingOpportunitiesResponse)
async def get_opportunities(request: SpendingOpportunitiesRequest):
    """
    Identify spending optimization opportunities
    """
    try:
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()
        deps = ScoutDependencies(session_id="api_opportunities", user_id=request.user_id, db_pool=db_pool)
        ctx = type('Context', (), {'deps': deps})()

        result = await identify_spending_opportunities(
            ctx,
            user_id=request.user_id
        )

        return SpendingOpportunitiesResponse(**result)

    except Exception as e:
        logger.error(f"Opportunities analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@scout_router.post("/chat", response_model=ScoutAgentResponse)
async def chat_with_scout(
    message: str,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None
):
    """
    Chat with Scout Agent (conversational interface)

    Use for complex market intelligence queries requiring agent reasoning
    """
    try:
        if not session_id:
            db_pool = await get_db_pool()
            session_id = await create_scout_session(db_pool, user_id)

        result = await run_scout_agent(
            user_query=message,
            session_id=session_id,
            user_id=user_id
        )

        response_text = result.data if hasattr(result, 'data') else str(result)

        return ScoutAgentResponse(
            session_id=session_id,
            response=response_text,
            tools_used=[],
            metadata={'user_id': user_id}
        )

    except Exception as e:
        logger.error(f"Scout chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@scout_router.get("/health")
async def scout_health():
    """Scout Agent health check"""
    return {
        'status': 'healthy',
        'agent': 'scout',
        'capabilities': [
            'namibian_financial_search',
            'exchange_rates',
            'spending_forecast',
            'pricing_analysis',
            'regulatory_updates',
            'spending_opportunities'
        ],
        'timestamp': datetime.now().isoformat()
    }


async def create_scout_session(db_pool, user_id):
    """Create Scout session"""
    import uuid
    return str(uuid.uuid4())
