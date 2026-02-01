"""
Scout Agent - Market Intelligence & Financial Forecasting

Production-ready agent for:
- Namibian financial institution monitoring (BoN, NAMFISA, MoF)
- Exchange rate tracking and forecasting
- Merchant pricing analysis
- Spending trend forecasting
- Regulatory updates tracking
- Spending optimization opportunities

Special Features:
- DuckDuckGo search integration for Namibian financial data
- Time series forecasting
- Market intelligence
"""

from .agent import (
    scout_agent,
    ScoutDependencies,
    run_scout_agent
)

from .models import (
    SearchRequest,
    SearchResponse,
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

from .api import scout_router

__all__ = [
    # Agent
    'scout_agent',
    'ScoutDependencies',
    'run_scout_agent',

    # Models
    'SearchRequest',
    'SearchResponse',
    'ExchangeRateRequest',
    'ExchangeRateResponse',
    'ForecastRequest',
    'ForecastResponse',
    'PricingAnalysisRequest',
    'PricingAnalysisResponse',
    'RegulatoryUpdateRequest',
    'RegulatoryUpdateResponse',
    'SpendingOpportunitiesRequest',
    'SpendingOpportunitiesResponse',
    'ScoutAgentResponse',

    # API
    'scout_router'
]

__version__ = '1.0.0'
