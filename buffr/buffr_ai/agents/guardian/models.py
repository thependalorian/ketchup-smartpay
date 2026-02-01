"""
Guardian Agent - Pydantic Models for Data Validation
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level enumeration"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"
    ERROR = "ERROR"
    UNKNOWN = "UNKNOWN"


class RecommendedAction(str, Enum):
    """Recommended action enumeration"""
    APPROVE = "APPROVE"
    REVIEW = "REVIEW"
    REQUEST_ADDITIONAL_VERIFICATION = "REQUEST_ADDITIONAL_VERIFICATION"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    DECLINE = "DECLINE"
    BLOCK_TRANSACTION = "BLOCK_TRANSACTION"


class CreditTier(str, Enum):
    """Credit tier enumeration"""
    EXCELLENT = "EXCELLENT"
    GOOD = "GOOD"
    FAIR = "FAIR"
    POOR = "POOR"
    DECLINED = "DECLINED"


# === Request Models ===

class FraudCheckRequest(BaseModel):
    """Request for fraud detection"""
    transaction_id: str
    amount: float = Field(..., gt=0, description="Transaction amount (NAD)")
    merchant_name: str
    merchant_mcc: int
    user_location: Dict[str, float]  # {lat, lon}
    merchant_location: Dict[str, float]  # {lat, lon}
    timestamp: str  # ISO format
    device_fingerprint: str
    beneficiary_account_age_days: int = Field(default=0, ge=0)
    card_present: bool = False

    @validator('user_location', 'merchant_location')
    def validate_location(cls, v):
        if 'lat' not in v or 'lon' not in v:
            raise ValueError("Location must contain 'lat' and 'lon' keys")
        if not (-90 <= v['lat'] <= 90):
            raise ValueError("Latitude must be between -90 and 90")
        if not (-180 <= v['lon'] <= 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v


class CreditAssessmentRequest(BaseModel):
    """Request for credit assessment"""
    user_id: str
    loan_amount_requested: float = Field(..., gt=0)

    # Transaction history
    total_transaction_volume: float = Field(..., ge=0)
    avg_transaction_amount: float = Field(..., ge=0)
    transaction_count: int = Field(..., ge=0)
    account_age_days: int = Field(..., ge=0)

    # Payment behavior
    successful_transactions: int = Field(..., ge=0)
    failed_transactions: int = Field(default=0, ge=0)
    avg_daily_balance: float = Field(default=0.0, ge=0)

    # Risk indicators
    fraud_incidents: int = Field(default=0, ge=0)
    disputed_transactions: int = Field(default=0, ge=0)
    chargebacks: int = Field(default=0, ge=0)

    # Optional income data
    monthly_income: Optional[float] = Field(None, gt=0)
    debt_to_income_ratio: Optional[float] = Field(None, ge=0, le=1)


class ComplianceCheckRequest(BaseModel):
    """Request for compliance check"""
    transaction_id: str
    transaction_data: Dict[str, Any]
    compliance_rules: List[str] = ['ETA_2019', 'AML_CFT', 'PSD']


class SpendingAnomalyRequest(BaseModel):
    """Request for spending anomaly detection"""
    user_id: str
    recent_transactions: List[Dict[str, Any]]
    time_window_days: int = Field(default=30, ge=1, le=365)


# === Response Models ===

class FraudCheckResponse(BaseModel):
    """Response from fraud detection"""
    transaction_id: str
    fraud_probability: float = Field(..., ge=0, le=1)
    is_fraud: bool
    risk_level: RiskLevel
    explanation: str
    model_breakdown: Dict[str, float]
    recommended_action: RecommendedAction
    confidence: float = Field(..., ge=0, le=1)
    timestamp: datetime = Field(default_factory=datetime.now)


class CreditAssessmentResponse(BaseModel):
    """Response from credit assessment"""
    user_id: str
    credit_score: int = Field(..., ge=300, le=850)
    default_probability: float = Field(..., ge=0, le=1)
    tier: CreditTier
    max_loan_amount: float = Field(..., ge=0)
    interest_rate: float = Field(..., ge=0, le=100)
    is_eligible: bool
    risk_factors: List[str]
    recommendation: str
    confidence: float = Field(..., ge=0, le=1)
    timestamp: datetime = Field(default_factory=datetime.now)


class ComplianceCheckResponse(BaseModel):
    """Response from compliance check"""
    transaction_id: str
    is_compliant: bool
    violations: List[str] = []
    warnings: List[str] = []
    recommendations: List[str] = []
    timestamp: datetime = Field(default_factory=datetime.now)


class SpendingAnomalyResponse(BaseModel):
    """Response from spending anomaly detection"""
    user_id: str
    has_anomalies: bool
    anomalies_detected: List[str]
    risk_score: float = Field(..., ge=0, le=1)
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


# === Database Models ===

class FraudCheck(BaseModel):
    """Fraud check record for database"""
    id: Optional[str] = None
    transaction_id: str
    session_id: str
    fraud_probability: float
    is_fraud: bool
    risk_level: str
    recommended_action: str
    model_scores: Dict[str, float]
    checked_at: datetime = Field(default_factory=datetime.now)


class CreditAssessment(BaseModel):
    """Credit assessment record for database"""
    id: Optional[str] = None
    user_id: str
    session_id: str
    credit_score: int
    tier: str
    max_loan_amount: float
    interest_rate: float
    loan_amount_requested: float
    is_eligible: bool
    assessed_at: datetime = Field(default_factory=datetime.now)


class GuardianSession(BaseModel):
    """Guardian agent session"""
    id: Optional[str] = None
    session_id: str
    user_id: Optional[str] = None
    agent_type: str = "guardian"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)


# === Agent Response Models ===

class GuardianAgentResponse(BaseModel):
    """General Guardian Agent response"""
    session_id: str
    response: str
    tools_used: List[Dict[str, Any]] = []
    risk_assessment: Optional[Dict[str, Any]] = None
    recommendations: List[str] = []
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.now)
