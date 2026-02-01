"""
Transaction Analyst Agent - Spending Analysis & Classification

Production-ready agent for:
- Automatic transaction categorization (98%+ accuracy)
- Spending pattern analysis with ML clustering
- User persona identification
- Budget recommendations
"""

from .agent import (
    transaction_analyst_agent,
    TransactionAnalystDependencies,
    run_transaction_analyst_agent,
    initialize_transaction_analyst_models
)

from .models import (
    TransactionClassificationRequest,
    TransactionClassificationResponse,
    SpendingAnalysisRequest,
    SpendingAnalysisResponse,
    BudgetRequest,
    BudgetResponse
)

from .api import transaction_analyst_router

__all__ = [
    # Agent
    'transaction_analyst_agent',
    'TransactionAnalystDependencies',
    'run_transaction_analyst_agent',
    'initialize_transaction_analyst_models',

    # Models
    'TransactionClassificationRequest',
    'TransactionClassificationResponse',
    'SpendingAnalysisRequest',
    'SpendingAnalysisResponse',
    'BudgetRequest',
    'BudgetResponse',

    # API
    'transaction_analyst_router'
]

__version__ = '1.0.0'
