"""
Crafter Agent - Workflow Automation & Orchestration

Uses LangGraph for complex workflow patterns
"""

from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from typing import Optional, Dict, Any
import logging

from .prompts import CRAFTER_SYSTEM_PROMPT
from .providers import get_llm_model

logger = logging.getLogger(__name__)


@dataclass
class CrafterDependencies:
    """Dependencies for Crafter Agent"""
    session_id: str
    user_id: Optional[str] = None
    db_pool: Optional[object] = None
    neo4j_client: Optional[object] = None


crafter_agent = Agent(
    get_llm_model(),
    deps_type=CrafterDependencies,
    retries=2,
    system_prompt=CRAFTER_SYSTEM_PROMPT
)


async def run_crafter_agent(
    user_query: str,
    session_id: str,
    user_id: Optional[str] = None
) -> Any:
    """
    Execute Crafter Agent for workflow automation.

    Args:
        user_query: User's workflow request
        session_id: Unique session identifier
        user_id: Optional user identifier

    Returns:
        Agent execution result
    """
    from .db_utils import get_db_pool

    db_pool = await get_db_pool()

    deps = CrafterDependencies(
        session_id=session_id,
        user_id=user_id,
        db_pool=db_pool
    )

    result = await crafter_agent.run(user_query, deps=deps)
    return result
