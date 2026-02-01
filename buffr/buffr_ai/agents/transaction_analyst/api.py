"""
Transaction Analyst Agent - FastAPI Endpoints
"""

import logging
from typing import Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends

from .agent import run_transaction_analyst_agent, initialize_transaction_analyst_models
from .models import (
    TransactionClassificationRequest,
    TransactionClassificationResponse,
    SpendingAnalysisRequest,
    SpendingAnalysisResponse,
    BudgetRequest,
    BudgetResponse
)

logger = logging.getLogger(__name__)

# ML models - optional (graceful degradation if not available)
try:
    from buffr_ai.ml.transaction_classification import TransactionClassifier, load_classifier
    from buffr_ai.ml.spending_analysis import SpendingAnalysisEngine, load_spending_models
    ML_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ML models not available (optional): {e}")
    ML_AVAILABLE = False
    # Create dummy classes for type hints
    TransactionClassifier = None
    SpendingAnalysisEngine = None
    load_classifier = None
    load_spending_models = None

# Create router
transaction_analyst_router = APIRouter(
    prefix="/transaction-analyst",
    tags=["Transaction Analyst Agent"]
)

# Global model instances
_classifier_model: Optional[TransactionClassifier] = None
_spending_model: Optional[SpendingAnalysisEngine] = None


async def get_classifier_model() -> TransactionClassifier:
    """Dependency to get transaction classifier"""
    global _classifier_model
    
    if not ML_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="ML models not available. Please install pandas, scikit-learn, and torch."
        )
    
    if _classifier_model is None or not _classifier_model.is_trained:
        _classifier_model = await load_classifier()
    return _classifier_model


async def get_spending_model() -> SpendingAnalysisEngine:
    """Dependency to get spending analysis model"""
    global _spending_model
    
    if not ML_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="ML models not available. Please install pandas, scikit-learn, and torch."
        )
    
    if _spending_model is None or not _spending_model.is_trained:
        _spending_model = await load_spending_models()
    return _spending_model


@transaction_analyst_router.post("/classify", response_model=TransactionClassificationResponse)
async def classify_transaction(
    request: TransactionClassificationRequest,
    classifier: TransactionClassifier = Depends(get_classifier_model)
):
    """Classify transaction into category"""
    try:
        transaction_data = {
            'merchant_name': request.merchant_name,
            'amount': request.amount,
            'merchant_mcc': request.merchant_mcc,
            'timestamp': request.timestamp
        }

        result = classifier.predict(transaction_data)

        explanation = f"Classified as {result['category']} with {result['confidence']:.1%} confidence"

        response_data = TransactionClassificationResponse(
            transaction_id=request.transaction_id,
            category=result['category'],
            confidence=result['confidence'],
            top_k_categories=result['top_k_categories'],
            explanation=explanation
        )
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }

    except Exception as e:
        logger.error(f"Transaction classification failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@transaction_analyst_router.post("/analyze", response_model=SpendingAnalysisResponse)
async def analyze_spending(
    request: SpendingAnalysisRequest,
    spending_model: SpendingAnalysisEngine = Depends(get_spending_model)
):
    """Analyze user spending patterns"""
    try:
        result = spending_model.analyze(
            user_id=request.user_id,
            transactions=request.transactions
        )

        response_data = SpendingAnalysisResponse(**result)
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }

    except Exception as e:
        logger.error(f"Spending analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@transaction_analyst_router.post("/budget", response_model=BudgetResponse)
async def generate_budget(
    request: BudgetRequest,
    spending_model: SpendingAnalysisEngine = Depends(get_spending_model)
):
    """Generate personalized budget"""
    try:
        result = spending_model.generate_budget(
            analysis=request.spending_analysis,
            savings_goal=request.savings_goal
        )

        response_data = BudgetResponse(
            user_id=request.user_id,
            **result
        )
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }

    except Exception as e:
        logger.error(f"Budget generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@transaction_analyst_router.post("/chat")
async def transaction_analyst_chat(message: str, user_id: Optional[str] = None):
    """
    Chat with Transaction Analyst agent.
    
    Matches TypeScript endpoint: POST /api/transaction-analyst/chat
    """
    try:
        result = await run_transaction_analyst_agent(
            user_query=message,
            session_id=f"chat_{user_id or 'anonymous'}",
            user_id=user_id
        )
        
        response_text = result.data if hasattr(result, 'data') else str(result)
        
        # Match TypeScript response format: { success: true, data: { message } }
        return {
            "success": True,
            "data": {
                "message": response_text
            }
        }
    except Exception as e:
        logger.error(f"Transaction Analyst chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@transaction_analyst_router.get("/health")
async def transaction_analyst_health():
    """Transaction Analyst Agent health check"""
    return {
        'status': 'healthy',
        'agent': 'transaction_analyst',
        'models_loaded': {
            'transaction_classifier': _classifier_model is not None and _classifier_model.is_trained,
            'spending_analysis': _spending_model is not None and _spending_model.is_trained
        },
        'timestamp': datetime.now().isoformat()
    }
