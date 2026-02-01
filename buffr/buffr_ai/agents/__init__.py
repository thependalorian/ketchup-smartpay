"""
Buffr AI - Multi-Agent System

Production-ready agents for financial intelligence:
- Guardian Agent: Fraud detection & credit scoring ✅
- Transaction Analyst Agent: Spending analysis & classification ✅
- Scout Agent: Market intelligence & forecasting ✅
- Mentor Agent: Financial education & guidance ✅
- Crafter Agent: Workflow automation ✅
- Main Companion: Multi-agent orchestrator ✅
"""

from .guardian import (
    guardian_agent,
    guardian_router,
    run_guardian_agent
)

from .transaction_analyst import (
    transaction_analyst_agent,
    transaction_analyst_router,
    run_transaction_analyst_agent
)

from .scout import (
    scout_agent,
    scout_router,
    run_scout_agent
)

from .mentor import (
    mentor_agent,
    mentor_router,
    run_mentor_agent
)

from .crafter import (
    crafter_agent,
    crafter_router,
    run_crafter_agent
)

from .companion import (
    companion_agent,
    companion_router,
    run_companion_agent
)

__all__ = [
    # Guardian Agent
    'guardian_agent',
    'guardian_router',
    'run_guardian_agent',

    # Transaction Analyst Agent
    'transaction_analyst_agent',
    'transaction_analyst_router',
    'run_transaction_analyst_agent',

    # Scout Agent
    'scout_agent',
    'scout_router',
    'run_scout_agent',

    # Mentor Agent
    'mentor_agent',
    'mentor_router',
    'run_mentor_agent',

    # Crafter Agent
    'crafter_agent',
    'crafter_router',
    'run_crafter_agent',

    # Main Companion
    'companion_agent',
    'companion_router',
    'run_companion_agent'
]

__version__ = '1.0.0'
