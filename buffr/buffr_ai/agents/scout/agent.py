"""
Scout Agent - Market Intelligence & Financial Forecasting

Responsibilities:
- Market trend analysis and forecasting
- Price intelligence and comparisons
- Currency volatility predictions
- Namibian financial institution monitoring
- Regulatory updates tracking
- Spending opportunity identification
"""

from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from typing import Optional, Dict, Any
import logging

from .prompts import SCOUT_SYSTEM_PROMPT
from .providers import get_llm_model

logger = logging.getLogger(__name__)


@dataclass
class ScoutDependencies:
    """Dependencies for Scout Agent"""
    session_id: str
    user_id: Optional[str] = None
    db_pool: Optional[object] = None
    neo4j_client: Optional[object] = None
    # No ML models needed - Scout uses time series and search


# Initialize Scout Agent
scout_agent = Agent(
    get_llm_model(),
    deps_type=ScoutDependencies,
    retries=2,
    system_prompt=SCOUT_SYSTEM_PROMPT
)


async def run_scout_agent(
    user_query: str,
    session_id: str,
    user_id: Optional[str] = None
) -> Any:
    """
    Execute Scout Agent for market intelligence

    Args:
        user_query: User's query or task
        session_id: Session identifier
        user_id: Optional user identifier

    Returns:
        Agent result with market insights and forecasts
    """
    # Initialize DB connections (if needed)
    from .db_utils import get_db_pool
    db_pool = await get_db_pool()

    # Create dependencies
    deps = ScoutDependencies(
        session_id=session_id,
        user_id=user_id,
        db_pool=db_pool
    )

    # Run agent
    result = await scout_agent.run(user_query, deps=deps)

    return result
