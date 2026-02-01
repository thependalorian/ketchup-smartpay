"""
Main Buffr AI Companion - Multi-Agent Orchestrator

Coordinates Guardian, Transaction Analyst, Scout, Mentor, and Crafter agents
"""

from pydantic_ai import Agent, RunContext
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
import logging

from .prompts import COMPANION_SYSTEM_PROMPT
from .providers import get_llm_model

logger = logging.getLogger(__name__)


@dataclass
class CompanionDependencies:
    """Dependencies for Companion Orchestrator"""
    session_id: str
    user_id: Optional[str] = None
    db_pool: Optional[object] = None
    neo4j_client: Optional[object] = None
    conversation_history: List[Dict[str, Any]] = None


companion_agent = Agent(
    get_llm_model(),
    deps_type=CompanionDependencies,
    retries=2,
    system_prompt=COMPANION_SYSTEM_PROMPT
)


async def run_companion_agent(
    user_query: str,
    session_id: str,
    user_id: Optional[str] = None,
    conversation_history: Optional[List[Dict[str, Any]]] = None
) -> Any:
    """
    Execute Main Buffr AI Companion orchestrator.

    Routes queries to specialized agents:
    - Guardian: Fraud detection, credit scoring, risk assessment
    - Transaction Analyst: Spending analysis, budgeting, insights
    - Scout: Market intelligence, forecasting, opportunities
    - Mentor: Financial education, goal setting, learning
    - Crafter: Workflow automation, scheduled payments, alerts

    Args:
        user_query: User's request or question
        session_id: Unique session identifier
        user_id: Optional user identifier
        conversation_history: Optional previous conversation messages

    Returns:
        Agent execution result with coordinated response
    """
    from .db_utils import get_db_pool

    db_pool = await get_db_pool()

    deps = CompanionDependencies(
        session_id=session_id,
        user_id=user_id,
        db_pool=db_pool,
        conversation_history=conversation_history or []
    )

    result = await companion_agent.run(user_query, deps=deps)
    return result
