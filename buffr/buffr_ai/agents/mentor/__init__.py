"""
Mentor Agent - Financial Education & Guidance

Based on GSMA Digital Financial Literacy Toolkit
"""

from .agent import mentor_agent, run_mentor_agent, MentorDependencies
from .api import mentor_router
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

__all__ = [
    # Agent
    'mentor_agent',
    'run_mentor_agent',
    'MentorDependencies',

    # Router
    'mentor_router',

    # Models
    'LiteracyAssessmentRequest',
    'LiteracyAssessmentResponse',
    'LearningPathRequest',
    'LearningPathResponse',
    'ConceptExplanationRequest',
    'ConceptExplanationResponse',
    'FinancialGoalRequest',
    'FinancialGoalResponse',
    'FraudTipsRequest',
    'FraudTipsResponse',
    'ProgressTrackingResponse'
]
