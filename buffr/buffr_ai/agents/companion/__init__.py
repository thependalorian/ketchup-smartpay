"""
Main Buffr AI Companion - Multi-Agent Orchestrator

Central conversational interface coordinating all specialized agents
"""

from .agent import companion_agent, run_companion_agent, CompanionDependencies
from .api import companion_router
from .models import (
    ChatRequest,
    ChatResponse,
    MultiAgentRequest,
    MultiAgentResponse,
    UserContextResponse
)

__all__ = [
    # Agent
    'companion_agent',
    'run_companion_agent',
    'CompanionDependencies',

    # Router
    'companion_router',

    # Models
    'ChatRequest',
    'ChatResponse',
    'MultiAgentRequest',
    'MultiAgentResponse',
    'UserContextResponse'
]
