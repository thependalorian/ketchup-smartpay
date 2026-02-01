"""
Transaction Analyst Agent - Spending Analysis & Classification

Responsibilities:
- Automatic transaction categorization (98%+ accuracy)
- Spending pattern analysis
- User spending personas
- Budget recommendations
- Financial insights generation
"""

from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from typing import Optional, Dict, Any
import logging

# Initialize logger before use
logger = logging.getLogger(__name__)

# Import ML models - optional (graceful degradation)
try:
    from buffr_ai.ml.transaction_classification import TransactionClassifier
    from buffr_ai.ml.spending_analysis import SpendingAnalysisEngine
    ML_AVAILABLE = True
except ImportError as e:
    logger.warning(f"ML models not available (optional): {e}")
    ML_AVAILABLE = False
    # Create dummy types for type hints
    TransactionClassifier = None
    SpendingAnalysisEngine = None

from .prompts import TRANSACTION_ANALYST_SYSTEM_PROMPT
from .providers import get_llm_model


@dataclass
class TransactionAnalystDependencies:
    """Dependencies for Transaction Analyst Agent"""
    session_id: str
    user_id: Optional[str] = None
    classifier_model: Optional[TransactionClassifier] = None
    spending_model: Optional[SpendingAnalysisEngine] = None
    db_pool: Optional[object] = None
    neo4j_client: Optional[object] = None


# Initialize Transaction Analyst Agent
transaction_analyst_agent = Agent(
    get_llm_model(),
    deps_type=TransactionAnalystDependencies,
    retries=2,
    system_prompt=TRANSACTION_ANALYST_SYSTEM_PROMPT
)


async def initialize_transaction_analyst_models() -> tuple[TransactionClassifier, SpendingAnalysisEngine]:
    """
    Load and initialize ML models for Transaction Analyst Agent

    Returns:
        Tuple of (classifier_model, spending_model)
    """
    if not ML_AVAILABLE:
        raise ImportError("ML models not available. Please install pandas, scikit-learn, and torch.")
    
    from buffr_ai.ml.transaction_classification import load_classifier
    from buffr_ai.ml.spending_analysis import load_spending_models

    logger.info("Loading Transaction Analyst ML models...")

    classifier_model = await load_classifier()
    spending_model = await load_spending_models()

    logger.info("✓ Transaction Analyst models loaded")

    return classifier_model, spending_model


async def run_transaction_analyst_agent(
    user_query: str,
    session_id: str,
    user_id: Optional[str] = None,
    classifier_model: Optional[TransactionClassifier] = None,
    spending_model: Optional[SpendingAnalysisEngine] = None
) -> Any:
    """
    Execute Transaction Analyst Agent with ML model dependencies

    Args:
        user_query: User's query or task
        session_id: Session identifier
        user_id: Optional user identifier
        classifier_model: Pre-loaded transaction classifier
        spending_model: Pre-loaded spending analysis engine

    Returns:
        Agent result with transaction insights and recommendations
    """
    # Initialize models if not provided
    if classifier_model is None or spending_model is None:
        classifier_model, spending_model = await initialize_transaction_analyst_models()

    # Initialize DB connections (if needed)
    from .db_utils import get_db_pool
    db_pool = await get_db_pool()

    # Create dependencies
    deps = TransactionAnalystDependencies(
        session_id=session_id,
        user_id=user_id,
        classifier_model=classifier_model,
        spending_model=spending_model,
        db_pool=db_pool
    )

    # Run agent
    result = await transaction_analyst_agent.run(user_query, deps=deps)

    return result
