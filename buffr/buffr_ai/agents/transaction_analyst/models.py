"""
Transaction Analyst Agent - Pydantic Models
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class TransactionClassificationRequest(BaseModel):
    """Request for transaction classification"""
    transaction_id: str
    merchant_name: str
    amount: float = Field(..., gt=0)
    merchant_mcc: int
    timestamp: str


class TransactionClassificationResponse(BaseModel):
    """Response from transaction classification"""
    transaction_id: str
    category: str
    confidence: float
    top_k_categories: List[Dict[str, Any]]
    explanation: str
    timestamp: datetime = Field(default_factory=datetime.now)


class SpendingAnalysisRequest(BaseModel):
    """Request for spending analysis"""
    user_id: str
    transactions: List[Dict[str, Any]]
    time_period_days: int = Field(default=30, ge=1, le=365)


class SpendingAnalysisResponse(BaseModel):
    """Response from spending analysis"""
    user_id: str
    user_persona: Dict[str, Any]
    spending_by_category: Dict[str, Dict[str, float]]
    total_spending: float
    avg_transaction: float
    transaction_count: int
    spending_trend: str
    is_unusual_spending: bool
    top_categories: List[str]
    insights: List[str]
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


class BudgetRequest(BaseModel):
    """Request for budget generation"""
    user_id: str
    spending_analysis: Dict[str, Any]
    savings_goal: Optional[float] = None


class BudgetResponse(BaseModel):
    """Response from budget generation"""
    user_id: str
    current_spending: float
    recommended_spending: float
    savings_goal: float
    achievability: str
    category_budgets: Dict[str, Dict[str, float]]
    total_savings_potential: float
    timestamp: datetime = Field(default_factory=datetime.now)
