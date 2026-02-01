"""
Guardian Agent - FastAPI Endpoints

Production API for Guardian Agent fraud detection and credit assessment
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import StreamingResponse, JSONResponse

from .agent import run_guardian_agent, initialize_guardian_models, GuardianDependencies
from .models import (
    FraudCheckRequest,
    FraudCheckResponse,
    CreditAssessmentRequest,
    CreditAssessmentResponse,
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    SpendingAnomalyRequest,
    SpendingAnomalyResponse,
    GuardianAgentResponse,
    RiskLevel,
    RecommendedAction
)
from .db_utils import (
    get_db_pool,
    create_guardian_session,
    store_fraud_check,
    store_credit_assessment
)

logger = logging.getLogger(__name__)

# ML models - optional (graceful degradation if not available)
try:
    from buffr_ai.ml.fraud_detection import FraudDetectionEnsemble, load_fraud_models
    from buffr_ai.ml.credit_scoring import CreditScoringEnsemble, load_credit_models
    ML_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ML models not available (optional): {e}")
    ML_AVAILABLE = False
    # Create dummy classes for type hints
    FraudDetectionEnsemble = None
    CreditScoringEnsemble = None
    load_fraud_models = None
    load_credit_models = None

# Create router
guardian_router = APIRouter(
    prefix="/guardian",
    tags=["Guardian Agent"]
)

# Global model instances (loaded on startup)
_fraud_model: Optional[FraudDetectionEnsemble] = None
_credit_model: Optional[CreditScoringEnsemble] = None


async def get_fraud_model() -> FraudDetectionEnsemble:
    """Dependency to get fraud detection model"""
    global _fraud_model
    
    if not ML_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="ML models not available. Please install pandas, scikit-learn, and torch."
        )

    if _fraud_model is None or not _fraud_model.is_trained:
        _fraud_model = await load_fraud_models()

    return _fraud_model


async def get_credit_model() -> CreditScoringEnsemble:
    """Dependency to get credit scoring model"""
    global _credit_model
    
    if not ML_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="ML models not available. Please install pandas, scikit-learn, and torch."
        )

    if _credit_model is None or not _credit_model.is_trained:
        _credit_model = await load_credit_models()

    return _credit_model


# === Endpoints ===

@guardian_router.post("/fraud/check", response_model=FraudCheckResponse)
async def check_fraud(
    request: FraudCheckRequest,
    fraud_model: FraudDetectionEnsemble = Depends(get_fraud_model)
):
    """
    Real-time fraud detection endpoint

    Guardian Agent - Core Fraud Detection Service
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

        # Extract features
        features = fraud_model.extract_features(transaction_data)
        features_array = features.to_array().reshape(1, -1)

        # Run fraud detection
        result = fraud_model.predict_ensemble(features_array)

        # Determine risk level
        fraud_prob = result['fraud_probability']

        if fraud_prob > 0.8:
            risk_level = RiskLevel.CRITICAL
            action = RecommendedAction.BLOCK_TRANSACTION
        elif fraud_prob > 0.6:
            risk_level = RiskLevel.HIGH
            action = RecommendedAction.MANUAL_REVIEW
        elif fraud_prob > 0.4:
            risk_level = RiskLevel.MEDIUM
            action = RecommendedAction.REQUEST_ADDITIONAL_VERIFICATION
        else:
            risk_level = RiskLevel.LOW
            action = RecommendedAction.APPROVE

        # Generate explanation
        explanation = f"Fraud probability: {fraud_prob:.1%}. "
        if fraud_prob > 0.5:
            explanation += "Multiple risk indicators detected across ML models. "
        else:
            explanation += "Transaction appears legitimate based on historical patterns. "

        # Store result (async)
        db_pool = await get_db_pool()
        await store_fraud_check(db_pool, transaction_data, result, risk_level.value, action.value)

        response_data = FraudCheckResponse(
            transaction_id=request.transaction_id,
            fraud_probability=fraud_prob,
            is_fraud=result['is_fraud'],
            risk_level=risk_level,
            explanation=explanation,
            model_breakdown=result['model_scores'],
            recommended_action=action,
            confidence=result.get('confidence', 0.95)
        )
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }

    except Exception as e:
        logger.error(f"Fraud check failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@guardian_router.post("/credit/assess", response_model=CreditAssessmentResponse)
async def assess_credit(
    request: CreditAssessmentRequest,
    credit_model: CreditScoringEnsemble = Depends(get_credit_model)
):
    """
    Credit risk assessment endpoint

    Guardian Agent - Credit Scoring Service for Buffr Lend
    """
    try:
        # Prepare merchant data
        merchant_data = {
            'user_id': request.user_id,
            'total_transaction_volume': request.total_transaction_volume,
            'avg_transaction_amount': request.avg_transaction_amount,
            'transaction_count': request.transaction_count,
            'account_age_days': request.account_age_days,
            'successful_transactions': request.successful_transactions,
            'failed_transactions': request.failed_transactions,
            'avg_daily_balance': request.avg_daily_balance,
            'fraud_incidents': request.fraud_incidents,
            'disputed_transactions': request.disputed_transactions,
            'chargebacks': request.chargebacks
        }

        # Extract features
        features = credit_model.extract_features(merchant_data)
        features_array = features.to_array().reshape(1, -1)

        # Run credit assessment
        assessment = credit_model.assess_credit(features_array)

        # Check eligibility
        is_eligible = request.loan_amount_requested <= assessment['max_loan_amount']

        # Generate risk factors
        risk_factors = []
        if request.failed_transactions > request.successful_transactions * 0.1:
            risk_factors.append("High transaction failure rate")
        if request.fraud_incidents > 0:
            risk_factors.append(f"{request.fraud_incidents} fraud incidents")
        if request.account_age_days < 90:
            risk_factors.append("Account age < 90 days")
        if request.avg_daily_balance < 1000:
            risk_factors.append("Low average balance")

        # Generate recommendation
        if is_eligible and assessment['tier'] in ['EXCELLENT', 'GOOD']:
            recommendation = f"APPROVE: Eligible for NAD {assessment['max_loan_amount']:.2f}"
        elif is_eligible:
            recommendation = f"CONDITIONAL: Additional verification recommended"
        else:
            recommendation = f"DECLINE: Requested amount exceeds qualification"

        # Store result
        db_pool = await get_db_pool()
        await store_credit_assessment(
            db_pool,
            request.user_id,
            assessment,
            request.loan_amount_requested,
            is_eligible
        )

        response_data = CreditAssessmentResponse(
            user_id=request.user_id,
            credit_score=assessment['credit_score'],
            default_probability=assessment['default_probability'],
            tier=assessment['tier'],
            max_loan_amount=assessment['max_loan_amount'],
            interest_rate=assessment['interest_rate'],
            is_eligible=is_eligible,
            risk_factors=risk_factors,
            recommendation=recommendation,
            confidence=assessment.get('confidence', 0.90)
        )
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }

    except Exception as e:
        logger.error(f"Credit assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@guardian_router.post("/chat", response_model=GuardianAgentResponse)
async def chat_with_guardian(
    message: str,
    session_id: Optional[str] = None,
    user_id: Optional[str] = None,
    fraud_model: FraudDetectionEnsemble = Depends(get_fraud_model),
    credit_model: CreditScoringEnsemble = Depends(get_credit_model)
):
    """
    Chat with Guardian Agent (conversational interface)

    Use for complex risk assessments requiring agent reasoning
    """
    try:
        # Create or use existing session
        if not session_id:
            db_pool = await get_db_pool()
            session_id = await create_guardian_session(db_pool, user_id)

        # Run Guardian Agent
        result = await run_guardian_agent(
            user_query=message,
            session_id=session_id,
            user_id=user_id,
            fraud_model=fraud_model,
            credit_model=credit_model
        )

        # Extract response
        response_text = result.data if hasattr(result, 'data') else str(result)

        response_data = GuardianAgentResponse(
            session_id=session_id,
            response=response_text,
            tools_used=[],
            metadata={'user_id': user_id}
        )
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": {
                "message": response_data.response,
                "session_id": response_data.session_id,
                "tools_used": response_data.tools_used,
                "metadata": response_data.metadata
            }
        }

    except Exception as e:
        logger.error(f"Guardian chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@guardian_router.get("/health")
async def guardian_health():
    """Guardian Agent health check"""
    return {
        'status': 'healthy',
        'agent': 'guardian',
        'models_loaded': {
            'fraud_detection': _fraud_model is not None and _fraud_model.is_trained,
            'credit_scoring': _credit_model is not None and _credit_model.is_trained
        },
        'timestamp': datetime.now().isoformat()
    }
