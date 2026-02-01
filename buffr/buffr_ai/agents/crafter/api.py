"""
Crafter Agent - FastAPI Router
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException

from .agent import run_crafter_agent
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
from .tools import (
    create_scheduled_payment,
    set_spending_alerts,
    automate_savings,
    create_workflow,
    execute_workflow,
    monitor_workflows
)
from .db_utils import get_db_pool

logger = logging.getLogger(__name__)

crafter_router = APIRouter(prefix="/crafter", tags=["Crafter Agent"])


@crafter_router.post("/scheduled-payment", response_model=ScheduledPaymentResponse)
async def create_payment_schedule(request: ScheduledPaymentRequest):
    """
    Create recurring scheduled payment workflow.

    Examples:
    - Monthly rent payments
    - Weekly grocery budget transfers
    - Annual insurance premiums
    - Daily savings contributions
    """
    try:
        from .agent import CrafterDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = CrafterDependencies(
            session_id=f"payment_{request.user_id}",
            user_id=request.user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await create_scheduled_payment(
            ctx,
            request.user_id,
            request.recipient,
            request.amount,
            request.frequency,
            request.start_date,
            request.end_date
        )

        response_data = ScheduledPaymentResponse(**result)
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }
    except Exception as e:
        logger.error(f"Scheduled payment creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@crafter_router.post("/spending-alert", response_model=SpendingAlertResponse)
async def create_spending_alert(request: SpendingAlertRequest):
    """
    Set spending alert workflows.

    Alert types:
    - daily_limit: Alert when daily spending exceeds threshold
    - category_limit: Alert when category spending exceeds threshold
    - unusual_activity: Alert on unusual spending patterns
    - budget_warning: Alert at 80% and 100% of budget
    """
    try:
        from .agent import CrafterDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = CrafterDependencies(
            session_id=f"alert_{request.user_id}",
            user_id=request.user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await set_spending_alerts(
            ctx,
            request.user_id,
            request.alert_type,
            request.threshold,
            request.categories
        )

        response_data = SpendingAlertResponse(**result)
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }
    except Exception as e:
        logger.error(f"Spending alert creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@crafter_router.post("/automate-savings", response_model=AutomatedSavingsResponse)
async def create_automated_savings(request: AutomatedSavingsRequest):
    """
    Create automated savings workflow.

    Strategies:
    - round_up: Round up transactions, save difference
    - percentage: Save percentage of income
    - fixed_amount: Save fixed amount periodically
    - smart_save: AI-driven savings based on patterns
    """
    try:
        from .agent import CrafterDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = CrafterDependencies(
            session_id=f"savings_{request.user_id}",
            user_id=request.user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await automate_savings(
            ctx,
            request.user_id,
            request.savings_strategy,
            request.target_amount,
            request.timeline_months
        )

        response_data = AutomatedSavingsResponse(**result)
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }
    except Exception as e:
        logger.error(f"Automated savings creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@crafter_router.post("/workflow/create", response_model=WorkflowCreateResponse)
async def create_custom_workflow(request: WorkflowCreateRequest):
    """
    Create custom workflow with LangGraph patterns.

    Workflow types:
    - sequential: Steps execute in order
    - parallel: Steps execute concurrently
    - conditional: Steps based on conditions
    - event_driven: Steps triggered by events
    """
    try:
        from .agent import CrafterDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = CrafterDependencies(
            session_id=f"workflow_{request.user_id}",
            user_id=request.user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await create_workflow(
            ctx,
            request.user_id,
            request.workflow_name,
            request.workflow_type,
            request.steps,
            request.triggers
        )

        response_data = WorkflowCreateResponse(**result)
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }
    except Exception as e:
        logger.error(f"Workflow creation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@crafter_router.post("/workflow/execute", response_model=WorkflowExecuteResponse)
async def execute_custom_workflow(request: WorkflowExecuteRequest):
    """
    Execute workflow using LangGraph.
    """
    try:
        from .agent import CrafterDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = CrafterDependencies(
            session_id=f"exec_{request.workflow_id}",
            user_id=None,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await execute_workflow(ctx, request.workflow_id, request.input_data)

        response_data = WorkflowExecuteResponse(**result)
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }
    except Exception as e:
        logger.error(f"Workflow execution failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@crafter_router.get("/workflow/monitor/{user_id}", response_model=WorkflowMonitorResponse)
async def monitor_user_workflows(user_id: str):
    """
    Monitor all active workflows for user.
    """
    try:
        from .agent import CrafterDependencies
        from pydantic_ai import RunContext

        db_pool = await get_db_pool()

        deps = CrafterDependencies(
            session_id=f"monitor_{user_id}",
            user_id=user_id,
            db_pool=db_pool
        )

        ctx = RunContext(deps=deps, retry=0)

        result = await monitor_workflows(ctx, user_id)

        response_data = WorkflowMonitorResponse(**result)
        
        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": response_data.dict() if hasattr(response_data, 'dict') else response_data.model_dump()
        }
    except Exception as e:
        logger.error(f"Workflow monitoring failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@crafter_router.post("/chat")
async def crafter_chat(user_id: str, message: str):
    """
    Conversational interface for Crafter Agent.
    """
    try:
        result = await run_crafter_agent(
            user_query=message,
            session_id=f"chat_{user_id}",
            user_id=user_id
        )

        # Match TypeScript response format: { success: true, data: {...} }
        return {
            "success": True,
            "data": {
                "message": result.data if hasattr(result, 'data') else str(result),
                "session_id": f"chat_{user_id}"
            }
        }
    except Exception as e:
        logger.error(f"Crafter chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@crafter_router.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "agent": "crafter",
        "capabilities": [
            "scheduled_payments",
            "spending_alerts",
            "automated_savings",
            "custom_workflows",
            "workflow_execution",
            "workflow_monitoring"
        ]
    }
