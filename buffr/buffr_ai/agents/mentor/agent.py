"""
Mentor Agent - Financial Education & Guidance

Responsibilities:
- Digital financial literacy assessment and training
- Personalized learning paths for financial education
- Financial goal setting and progress tracking
- Fraud prevention and consumer protection education
- Safe usage guidance for digital financial services
- Financial concept explanations (Namibian context)
- Budget and savings strategies coaching
"""

from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from typing import Optional, Dict, Any
import logging

from .prompts import MENTOR_SYSTEM_PROMPT
from .providers import get_llm_model

logger = logging.getLogger(__name__)


@dataclass
class MentorDependencies:
    """Dependencies for Mentor Agent"""
    session_id: str
    user_id: Optional[str] = None
    db_pool: Optional[object] = None
    neo4j_client: Optional[object] = None
    # Uses spending analysis model for user segmentation (from Transaction Analyst)


# Initialize Mentor Agent
mentor_agent = Agent(
    get_llm_model(),
    deps_type=MentorDependencies,
    retries=2,
    system_prompt=MENTOR_SYSTEM_PROMPT
)


async def run_mentor_agent(
    user_query: str,
    session_id: str,
    user_id: Optional[str] = None
) -> Any:
    """
    Execute Mentor Agent for financial education

    Args:
        user_query: User's question or learning request
        session_id: Session identifier
        user_id: Optional user identifier

    Returns:
        Agent result with educational content and guidance
    """
    # Initialize DB connections (if needed)
    from .db_utils import get_db_pool
    db_pool = await get_db_pool()

    # Create dependencies
    deps = MentorDependencies(
        session_id=session_id,
        user_id=user_id,
        db_pool=db_pool
    )

    # Run agent
    result = await mentor_agent.run(user_query, deps=deps)

    return result
