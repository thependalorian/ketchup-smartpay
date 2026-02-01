"""
Mentor Agent - FastAPI Router
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException

from .agent import run_mentor_agent
from .models import (
    LiteracyAssessmentRequest,
    LiteracyAssessmentResponse,
    LearningPathRequest,
    LearningPathResponse,
    ConceptExplanationRequest,
    ConceptExplanationResponse,
    FinancialGoalRequest,
    FinancialGoalResponse,
    FraudTipsRequest,
    FraudTipsResponse,
    ProgressTrackingResponse
)
from .tools import (
    assess_financial_literacy,
    get_learning_path,
    explain_financial_concept,
    set_financial_goal,
    get_fraud_prevention_tips,
    track_learning_progress
)
from .db_utils import get_db_pool

logger = logging.getLogger(__name__)

mentor_router = APIRouter(prefix="/mentor", tags=["Mentor Agent"])


@mentor_router.post("/assess", response_model=LiteracyAssessmentResponse)
async def assess_literacy(request: LiteracyAssessmentRequest):
    """
    Assess user's digital financial literacy level.

    Based on GSMA Digital Financial Literacy framework:
    - Digital literacy (using apps, SMS, USSD)
    - Financial literacy (saving, borrowing, budgeting)
    - Numeracy skills (calculations, percentages)
    - Fraud awareness (scams, security)
    """
    try:
        from .agent import MentorDependencies, mentor_agent
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = MentorDependencies(
            session_id=f"assess_{request.user_id}",
            user_id=request.user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        # Call the assessment tool directly
        result = await assess_financial_literacy(
            ctx,
            request.user_id,
            request.assessment_answers
        )

        return LiteracyAssessmentResponse(
            user_id=request.user_id,
            literacy_level=result['literacy_level'],
            overall_score=result['overall_score'],
            digital_literacy_score=result['digital_literacy_score'],
            financial_literacy_score=result['financial_literacy_score'],
            numeracy_score=result['numeracy_score'],
            fraud_awareness_score=result['fraud_awareness_score'],
            strengths=result['strengths'],
            areas_for_improvement=result['areas_for_improvement'],
            recommended_learning_path=result['recommended_learning_path']
        )
    except Exception as e:
        logger.error(f"Literacy assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mentor_router.post("/learning-path", response_model=LearningPathResponse)
async def get_personalized_learning_path(request: LearningPathRequest):
    """
    Generate personalized learning path based on literacy level.

    Three learning paths:
    1. Foundational Skills (basic) - Using Buffr, basic security
    2. Financial Management (intermediate) - Budgeting, savings, loans
    3. Advanced Strategies (advanced) - Investments, tax, retirement
    """
    try:
        from .agent import MentorDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = MentorDependencies(
            session_id=f"learning_{request.user_id}",
            user_id=request.user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await get_learning_path(ctx, request.user_id, request.literacy_level)

        return LearningPathResponse(
            user_id=request.user_id,
            learning_path=result['learning_path'],
            literacy_level=request.literacy_level,
            modules=result['modules'],
            estimated_completion_time=result['estimated_time'],
            next_lesson=result['next_lesson'],
            progress=result['progress']
        )
    except Exception as e:
        logger.error(f"Learning path generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mentor_router.post("/explain-concept", response_model=ConceptExplanationResponse)
async def explain_concept(request: ConceptExplanationRequest):
    """
    Explain financial concepts in simple terms with Namibian context.

    Concepts: interest_rate, credit_score, budgeting, nad_currency, savings, loan
    """
    try:
        from .agent import MentorDependencies
        from pydantic_ai import RunContext

        deps = MentorDependencies(
            session_id=f"explain_{request.concept}",
            user_id=None
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await explain_financial_concept(ctx, request.concept, request.user_level)

        return ConceptExplanationResponse(
            concept=request.concept,
            simple_explanation=result['simple_explanation'],
            detailed_explanation=result['detailed_explanation'],
            namibian_context=result['namibian_context'],
            example=result['example'],
            related_concepts=result['related_concepts']
        )
    except Exception as e:
        logger.error(f"Concept explanation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mentor_router.post("/set-goal", response_model=FinancialGoalResponse)
async def create_goal(request: FinancialGoalRequest):
    """
    Set financial goal with achievability assessment.
    """
    try:
        from .agent import MentorDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = MentorDependencies(
            session_id=f"goal_{request.user_id}",
            user_id=request.user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await set_financial_goal(
            ctx,
            request.user_id,
            request.goal_name,
            request.target_amount,
            request.target_date,
            request.category
        )

        return FinancialGoalResponse(
            goal_id=result['goal_id'],
            user_id=request.user_id,
            goal_name=request.goal_name,
            target_amount=request.target_amount,
            target_date=request.target_date,
            months_remaining=result['months_remaining'],
            monthly_savings_needed=result['monthly_savings_needed'],
            achievability=result['achievability'],
            recommendations=result['recommendations'],
            milestones=result['milestones'],
            category=request.category
        )
    except Exception as e:
        logger.error(f"Goal creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mentor_router.post("/fraud-tips", response_model=FraudTipsResponse)
async def get_fraud_tips(request: FraudTipsRequest):
    """
    Get fraud prevention tips based on risk level.

    Risk levels: general, elevated, critical
    """
    try:
        from .agent import MentorDependencies
        from pydantic_ai import RunContext

        deps = MentorDependencies(
            session_id=f"fraud_tips",
            user_id=None
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await get_fraud_prevention_tips(ctx, request.risk_level)

        return FraudTipsResponse(
            risk_level=request.risk_level,
            tips=result['tips']
        )
    except Exception as e:
        logger.error(f"Fraud tips retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mentor_router.get("/progress/{user_id}", response_model=ProgressTrackingResponse)
async def get_progress(user_id: str):
    """
    Track user's learning progress and achievements.
    """
    try:
        from .agent import MentorDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = MentorDependencies(
            session_id=f"progress_{user_id}",
            user_id=user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await track_learning_progress(ctx, user_id)

        return ProgressTrackingResponse(
            user_id=user_id,
            current_level=result['current_level'],
            overall_score=result['overall_score'],
            modules_completed=result['modules_completed'],
            completed_module_names=result['completed_module_names'],
            skills_acquired=result['skills_acquired'],
            achievements=result['achievements'],
            next_steps=result['next_steps']
        )
    except Exception as e:
        logger.error(f"Progress tracking failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mentor_router.post("/chat")
async def mentor_chat(user_id: str, message: str):
    """
    Conversational interface for Mentor Agent.
    """
    try:
        result = await run_mentor_agent(
            user_query=message,
            session_id=f"chat_{user_id}",
            user_id=user_id
        )

        return {
            "response": result.data,
            "session_id": f"chat_{user_id}"
        }
    except Exception as e:
        logger.error(f"Mentor chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mentor_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent": "mentor",
        "capabilities": [
            "literacy_assessment",
            "learning_paths",
            "concept_explanation",
            "goal_setting",
            "fraud_prevention",
            "progress_tracking"
        ]
    }
