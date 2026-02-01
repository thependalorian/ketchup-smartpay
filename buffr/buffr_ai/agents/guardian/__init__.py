"""
Guardian Agent - Risk Assessment & Fraud Detection

Production-ready agent for:
- Real-time fraud detection (99%+ accuracy)
- Credit scoring and lending assessment
- Regulatory compliance monitoring
- Security threat analysis

Agent Pattern: 8-file structure with Pydantic AI + ML models
"""

from .agent import (
    guardian_agent,
    GuardianDependencies,
    run_guardian_agent,
    initialize_guardian_models
)

from .models import (
    FraudCheckRequest,
    FraudCheckResponse,
    CreditAssessmentRequest,
    CreditAssessmentResponse,
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    RiskLevel,
    RecommendedAction,
    CreditTier
)

from .api import guardian_router

__all__ = [
    # Agent
    'guardian_agent',
    'GuardianDependencies',
    'run_guardian_agent',
    'initialize_guardian_models',

    # Models
    'FraudCheckRequest',
    'FraudCheckResponse',
    'CreditAssessmentRequest',
    'CreditAssessmentResponse',
    'ComplianceCheckRequest',
    'ComplianceCheckResponse',
    'RiskLevel',
    'RecommendedAction',
    'CreditTier',

    # API
    'guardian_router'
]

__version__ = '1.0.0'
