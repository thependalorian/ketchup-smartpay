"""
FastAPI backend for Buffr ML Services

Production-ready ML microservices for:
- Fraud Detection (Guardian Agent)
- Credit Scoring (Guardian Agent)
- Transaction Classification (Transaction Analyst)
- Spending Analysis (Transaction Analyst)
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
import uvicorn
from dotenv import load_dotenv

from buffr_ai.ml.fraud_detection import FraudDetectionEnsemble, load_fraud_models
from buffr_ai.ml.credit_scoring import CreditScoringEnsemble, load_credit_models
from buffr_ai.ml.spending_analysis import SpendingAnalysisEngine, load_spending_models
from buffr_ai.ml.transaction_classification import TransactionClassifier, load_classifier

# Load environment
load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

# Global model instances
fraud_model: Optional[FraudDetectionEnsemble] = None
credit_model: Optional[CreditScoringEnsemble] = None
spending_model: Optional[SpendingAnalysisEngine] = None
classifier_model: Optional[TransactionClassifier] = None


# === REQUEST/RESPONSE MODELS ===

class FraudCheckRequest(BaseModel):
    """Request for fraud detection"""
    transaction_id: str
    user_id: str
    amount: float = Field(..., gt=0)
    merchant_name: str
    merchant_mcc: int
    merchant_location: Dict[str, float]  # {lat, lon}
    user_location: Dict[str, float]  # {lat, lon}
    timestamp: datetime
    device_fingerprint: str
    beneficiary_account_age_days: int = Field(default=0, ge=0)

    @validator('merchant_location', 'user_location')
    def validate_location(cls, v):
        if 'lat' not in v or 'lon' not in v:
            raise ValueError("Location must contain 'lat' and 'lon'")
        return v


class FraudCheckResponse(BaseModel):
    """Response from fraud detection"""
    transaction_id: str
    fraud_probability: float
    is_fraud: bool
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    recommended_action: str  # APPROVE, REVIEW, DECLINE, BLOCK
    model_scores: Dict[str, float]
    confidence: float
    timestamp: datetime = Field(default_factory=datetime.now)


class CreditAssessmentRequest(BaseModel):
    """Request for credit scoring"""
    user_id: str
    merchant_id: Optional[str] = None

    # Transaction history features
    total_transaction_volume: float = Field(..., ge=0)
    avg_transaction_amount: float = Field(..., ge=0)
    transaction_count: int = Field(..., ge=0)
    account_age_days: int = Field(..., ge=0)

    # Payment behavior
    successful_transactions: int = Field(..., ge=0)
    failed_transactions: int = Field(default=0, ge=0)
    avg_daily_balance: float = Field(..., ge=0)

    # Risk indicators
    fraud_incidents: int = Field(default=0, ge=0)
    disputed_transactions: int = Field(default=0, ge=0)
    chargebacks: int = Field(default=0, ge=0)

    # Optional income data
    monthly_income: Optional[float] = Field(None, gt=0)
    debt_to_income_ratio: Optional[float] = Field(None, ge=0, le=1)


class CreditAssessmentResponse(BaseModel):
    """Response from credit scoring"""
    user_id: str
    credit_score: int  # 300-850
    credit_tier: str  # EXCELLENT, GOOD, FAIR, POOR, DECLINED
    max_loan_amount: float  # NAD
    interest_rate: float  # %
    confidence: float
    risk_factors: List[str]
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


class TransactionClassificationRequest(BaseModel):
    """Request for transaction classification"""
    transaction_id: str
    merchant_name: str
    amount: float
    merchant_mcc: int
    timestamp: datetime


class TransactionClassificationResponse(BaseModel):
    """Response from transaction classification"""
    transaction_id: str
    category: str
    confidence: float
    top_k_categories: List[Dict[str, Any]]
    timestamp: datetime = Field(default_factory=datetime.now)


class SpendingAnalysisRequest(BaseModel):
    """Request for spending analysis"""
    user_id: str
    transactions: List[Dict[str, Any]]  # List of transaction dicts
    time_period_days: int = Field(default=30, ge=1, le=365)


class SpendingAnalysisResponse(BaseModel):
    """Response from spending analysis"""
    user_id: str
    user_persona: Dict[str, Any]
    spending_by_category: Dict[str, Dict[str, float]]
    total_spending: float
    avg_transaction: float
    transaction_count: int
    spending_trend: str  # increasing, decreasing, stable
    is_unusual_spending: bool
    top_categories: List[str]
    insights: List[str]
    recommendations: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


class BudgetGenerationRequest(BaseModel):
    """Request for budget generation"""
    user_id: str
    analysis: Dict[str, Any]  # Previous spending analysis
    savings_goal: Optional[float] = None


class BudgetGenerationResponse(BaseModel):
    """Response from budget generation"""
    user_id: str
    current_spending: float
    recommended_spending: float
    savings_goal: float
    achievability: str  # high, moderate, low
    category_budgets: Dict[str, Dict[str, float]]
    total_savings_potential: float
    timestamp: datetime = Field(default_factory=datetime.now)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str  # healthy, degraded, unhealthy
    models_loaded: Dict[str, bool]
    version: str
    timestamp: datetime


# === LIFESPAN & APP INITIALIZATION ===

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup"""
    global fraud_model, credit_model, spending_model, classifier_model

    logger.info("Loading Buffr ML models...")

    try:
        # Load fraud detection model
        logger.info("Loading fraud detection model...")
        fraud_model = await load_fraud_models()
        logger.info("✓ Fraud detection model loaded")

        # Load credit scoring model
        logger.info("Loading credit scoring model...")
        credit_model = await load_credit_models()
        logger.info("✓ Credit scoring model loaded")

        # Load spending analysis model
        logger.info("Loading spending analysis model...")
        spending_model = await load_spending_models()
        logger.info("✓ Spending analysis model loaded")

        # Load transaction classifier
        logger.info("Loading transaction classifier...")
        classifier_model = await load_classifier()
        logger.info("✓ Transaction classifier loaded")

        logger.info("All ML models loaded successfully!")

    except Exception as e:
        logger.error(f"Failed to load ML models: {e}")
        # Continue anyway - models will show as not loaded in health check

    yield

    # Cleanup
    logger.info("Shutting down Buffr ML services...")


app = FastAPI(
    title="Buffr ML Services",
    description="Production ML microservices for Buffr Payment Companion",
    version="1.0.0",
    lifespan=lifespan
)

# CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.add_middleware(GZipMiddleware, minimum_size=1000)


# === MODEL DEPENDENCY HELPERS ===

async def get_fraud_model() -> FraudDetectionEnsemble:
    """Get fraud detection model"""
    if fraud_model is None or not fraud_model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Fraud detection model not available"
        )
    return fraud_model


async def get_credit_model() -> CreditScoringEnsemble:
    """Get credit scoring model"""
    if credit_model is None or not credit_model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Credit scoring model not available"
        )
    return credit_model


async def get_spending_model() -> SpendingAnalysisEngine:
    """Get spending analysis model"""
    if spending_model is None or not spending_model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Spending analysis model not available"
        )
    return spending_model


async def get_classifier_model() -> TransactionClassifier:
    """Get transaction classifier"""
    if classifier_model is None or not classifier_model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Transaction classifier not available"
        )
    return classifier_model


# === API ENDPOINTS ===

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    models_status = {
        "fraud_detection": fraud_model is not None and fraud_model.is_trained,
        "credit_scoring": credit_model is not None and credit_model.is_trained,
        "spending_analysis": spending_model is not None and spending_model.is_trained,
        "transaction_classifier": classifier_model is not None and classifier_model.is_trained
    }

    all_healthy = all(models_status.values())
    some_healthy = any(models_status.values())

    if all_healthy:
        status = "healthy"
    elif some_healthy:
        status = "degraded"
    else:
        status = "unhealthy"

    return HealthResponse(
        status=status,
        models_loaded=models_status,
        version="1.0.0",
        timestamp=datetime.now()
    )


@app.post("/fraud/check", response_model=FraudCheckResponse)
async def check_fraud(
    request: FraudCheckRequest,
    model: FraudDetectionEnsemble = Depends(get_fraud_model)
):
    """
    Check transaction for fraud

    Guardian Agent - Fraud Detection Service
    """
    try:
        # Prepare transaction data
        transaction_data = {
            'transaction_id': request.transaction_id,
            'amount': request.amount,
            'merchant_name': request.merchant_name,
            'merchant_mcc': request.merchant_mcc,
            'merchant_location': request.merchant_location,
            'user_location': request.user_location,
            'timestamp': request.timestamp,
            'device_fingerprint': request.device_fingerprint,
            'beneficiary_account_age_days': request.beneficiary_account_age_days
        }

        # Run fraud detection
        result = await model.detect_fraud(transaction_data)

        return FraudCheckResponse(
            transaction_id=request.transaction_id,
            fraud_probability=result['fraud_probability'],
            is_fraud=result['is_fraud'],
            risk_level=result['risk_level'],
            recommended_action=result['recommended_action'],
            model_scores=result['model_scores'],
            confidence=result['confidence']
        )

    except Exception as e:
        logger.error(f"Fraud check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/credit/assess", response_model=CreditAssessmentResponse)
async def assess_credit(
    request: CreditAssessmentRequest,
    model: CreditScoringEnsemble = Depends(get_credit_model)
):
    """
    Assess credit worthiness

    Guardian Agent - Credit Scoring Service
    """
    try:
        # Prepare merchant data
        merchant_data = {
            'user_id': request.user_id,
            'merchant_id': request.merchant_id,
            'total_transaction_volume': request.total_transaction_volume,
            'avg_transaction_amount': request.avg_transaction_amount,
            'transaction_count': request.transaction_count,
            'account_age_days': request.account_age_days,
            'successful_transactions': request.successful_transactions,
            'failed_transactions': request.failed_transactions,
            'avg_daily_balance': request.avg_daily_balance,
            'fraud_incidents': request.fraud_incidents,
            'disputed_transactions': request.disputed_transactions,
            'chargebacks': request.chargebacks,
            'monthly_income': request.monthly_income,
            'debt_to_income_ratio': request.debt_to_income_ratio
        }

        # Run credit assessment
        result = await model.assess_credit(merchant_data)

        return CreditAssessmentResponse(
            user_id=request.user_id,
            credit_score=result['credit_score'],
            credit_tier=result['tier'],
            max_loan_amount=result['max_loan_amount'],
            interest_rate=result['interest_rate'],
            confidence=result['confidence'],
            risk_factors=result['risk_factors'],
            recommendations=result['recommendations']
        )

    except Exception as e:
        logger.error(f"Credit assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transactions/classify", response_model=TransactionClassificationResponse)
async def classify_transaction(
    request: TransactionClassificationRequest,
    model: TransactionClassifier = Depends(get_classifier_model)
):
    """
    Classify transaction category

    Transaction Analyst Agent - Classification Service
    """
    try:
        # Prepare transaction data
        transaction_data = {
            'merchant_name': request.merchant_name,
            'amount': request.amount,
            'merchant_mcc': request.merchant_mcc,
            'timestamp': request.timestamp
        }

        # Run classification
        result = model.predict(transaction_data)

        return TransactionClassificationResponse(
            transaction_id=request.transaction_id,
            category=result['category'],
            confidence=result['confidence'],
            top_k_categories=result['top_k_categories']
        )

    except Exception as e:
        logger.error(f"Transaction classification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/spending/analyze", response_model=SpendingAnalysisResponse)
async def analyze_spending(
    request: SpendingAnalysisRequest,
    model: SpendingAnalysisEngine = Depends(get_spending_model)
):
    """
    Analyze user spending patterns

    Transaction Analyst Agent - Spending Analysis Service
    """
    try:
        # Run spending analysis
        result = model.analyze(
            user_id=request.user_id,
            transactions=request.transactions
        )

        return SpendingAnalysisResponse(**result)

    except Exception as e:
        logger.error(f"Spending analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/spending/budget", response_model=BudgetGenerationResponse)
async def generate_budget(
    request: BudgetGenerationRequest,
    model: SpendingAnalysisEngine = Depends(get_spending_model)
):
    """
    Generate personalized budget

    Transaction Analyst Agent - Budget Generation Service
    """
    try:
        # Generate budget
        result = model.generate_budget(
            analysis=request.analysis,
            savings_goal=request.savings_goal
        )

        return BudgetGenerationResponse(
            user_id=request.user_id,
            **result
        )

    except Exception as e:
        logger.error(f"Budget generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "error_type": type(exc).__name__,
            "request_id": str(uuid.uuid4())
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "ml_api:app",
        host=os.getenv("ML_API_HOST", "0.0.0.0"),
        port=int(os.getenv("ML_API_PORT", 8001)),
        reload=os.getenv("APP_ENV", "development") == "development"
    )
