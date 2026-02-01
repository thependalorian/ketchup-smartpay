"""
Crafter Agent - Workflow Automation & Orchestration

LangGraph-based workflow patterns for financial automation
"""

from .agent import crafter_agent, run_crafter_agent, CrafterDependencies
from .api import crafter_router
from .models import (
    ScheduledPaymentRequest,
    ScheduledPaymentResponse,
    SpendingAlertRequest,
    SpendingAlertResponse,
    AutomatedSavingsRequest,
    AutomatedSavingsResponse,
    WorkflowCreateRequest,
    WorkflowCreateResponse,
    WorkflowExecuteRequest,
    WorkflowExecuteResponse,
    WorkflowMonitorResponse
)

__all__ = [
    # Agent
    'crafter_agent',
    'run_crafter_agent',
    'CrafterDependencies',

    # Router
    'crafter_router',

    # Models
    'ScheduledPaymentRequest',
    'ScheduledPaymentResponse',
    'SpendingAlertRequest',
    'SpendingAlertResponse',
    'AutomatedSavingsRequest',
    'AutomatedSavingsResponse',
    'WorkflowCreateRequest',
    'WorkflowCreateResponse',
    'WorkflowExecuteRequest',
    'WorkflowExecuteResponse',
    'WorkflowMonitorResponse'
]
