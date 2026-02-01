"""
Scout Agent - Pydantic Models
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    """Request for Namibian financial search"""
    query: str = Field(..., min_length=3)
    max_results: int = Field(default=5, ge=1, le=20)


class SearchResult(BaseModel):
    """Search result from DuckDuckGo"""
    title: str
    link: str
    snippet: str
    source: str


class SearchResponse(BaseModel):
    """Response from search"""
    query: str
    results: List[SearchResult]
    result_count: int
    timestamp: datetime = Field(default_factory=datetime.now)


class ExchangeRateRequest(BaseModel):
    """Request for exchange rates"""
    base_currency: str = Field(default="NAD")
    target_currencies: List[str] = Field(default=["USD", "EUR", "ZAR", "GBP"])


class ExchangeRateResponse(BaseModel):
    """Response with exchange rates"""
    base_currency: str
    rates: Dict[str, float]
    last_updated: datetime
    source: str
    timestamp: datetime = Field(default_factory=datetime.now)


class ForecastRequest(BaseModel):
    """Request for spending forecast"""
    user_id: str
    forecast_days: int = Field(default=30, ge=1, le=365)


class ForecastResponse(BaseModel):
    """Response with spending forecast"""
    user_id: str
    forecast: List[float]
    forecast_dates: List[str]
    trend: str  # increasing, decreasing, stable
    confidence: float = Field(..., ge=0, le=1)
    insights: List[str]
    historical_avg: float
    forecast_avg: float
    timestamp: datetime = Field(default_factory=datetime.now)


class PricingAnalysisRequest(BaseModel):
    """Request for merchant pricing analysis"""
    merchant_category: str
    location: Optional[str] = None


class PricingAnalysisResponse(BaseModel):
    """Response with pricing analysis"""
    category: str
    avg_price: float
    price_trend: str  # increasing, decreasing, stable
    top_merchants: List[Dict[str, Any]]
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


class RegulatoryUpdateRequest(BaseModel):
    """Request for regulatory updates"""
    topic: Optional[str] = None
    max_results: int = Field(default=10, ge=1, le=20)


class RegulatoryUpdateResponse(BaseModel):
    """Response with regulatory updates"""
    updates: List[SearchResult]
    count: int
    timestamp: datetime = Field(default_factory=datetime.now)


class SpendingOpportunitiesRequest(BaseModel):
    """Request for spending opportunities"""
    user_id: str


class SpendingOpportunitiesResponse(BaseModel):
    """Response with spending opportunities"""
    user_id: str
    opportunities: List[Dict[str, Any]]
    potential_savings: float
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


class ScoutAgentResponse(BaseModel):
    """General Scout Agent response"""
    session_id: str
    response: str
    tools_used: List[Dict[str, Any]] = []
    insights: List[str] = []
    recommendations: List[str] = []
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)
