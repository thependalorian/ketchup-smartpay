"""
Mentor Agent - Pydantic Models
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class LiteracyAssessmentRequest(BaseModel):
    """Request for financial literacy assessment"""
    user_id: str
    assessment_answers: Dict[str, Any]


class LiteracyAssessmentResponse(BaseModel):
    """Response from literacy assessment"""
    user_id: str
    literacy_level: str  # basic, intermediate, advanced
    overall_score: float
    digital_literacy_score: float
    financial_literacy_score: float
    numeracy_score: float
    fraud_awareness_score: float
    strengths: List[str]
    areas_for_improvement: List[str]
    recommended_learning_path: str
    timestamp: datetime = Field(default_factory=datetime.now)


class LearningPathRequest(BaseModel):
    """Request for learning path"""
    user_id: str
    literacy_level: str = 'intermediate'


class LearningPathResponse(BaseModel):
    """Response with personalized learning path"""
    user_id: str
    learning_path: str
    literacy_level: str
    modules: List[Dict[str, Any]]
    estimated_completion_time: str
    next_lesson: Dict[str, Any]
    progress: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.now)


class ConceptExplanationRequest(BaseModel):
    """Request for concept explanation"""
    concept: str
    user_level: str = 'basic'


class ConceptExplanationResponse(BaseModel):
    """Response with concept explanation"""
    concept: str
    simple_explanation: str
    detailed_explanation: str
    namibian_context: str
    example: str
    related_concepts: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


class FinancialGoalRequest(BaseModel):
    """Request to set financial goal"""
    user_id: str
    goal_name: str
    target_amount: float = Field(..., gt=0)
    target_date: str  # ISO format
    category: str = 'savings'


class FinancialGoalResponse(BaseModel):
    """Response with goal details"""
    goal_id: str
    user_id: str
    goal_name: str
    target_amount: float
    target_date: str
    months_remaining: int
    monthly_savings_needed: float
    achievability: str
    recommendations: List[str]
    milestones: List[Dict[str, Any]]
    category: str
    timestamp: datetime = Field(default_factory=datetime.now)


class FraudTipsRequest(BaseModel):
    """Request for fraud prevention tips"""
    risk_level: str = 'general'  # general, elevated, critical


class FraudTipsResponse(BaseModel):
    """Response with fraud prevention tips"""
    risk_level: str
    tips: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


class ProgressTrackingResponse(BaseModel):
    """Response with learning progress"""
    user_id: str
    current_level: str
    overall_score: float
    modules_completed: int
    completed_module_names: List[str]
    skills_acquired: List[str]
    achievements: List[str]
    next_steps: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)
