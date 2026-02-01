"""
Crafter Agent - Pydantic Models
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ScheduledPaymentRequest(BaseModel):
    """Request to create scheduled payment"""
    user_id: str
    recipient: str
    amount: float = Field(..., gt=0)
    frequency: str  # daily, weekly, monthly, yearly
    start_date: str  # ISO format
    end_date: Optional[str] = None


class ScheduledPaymentResponse(BaseModel):
    """Response from scheduled payment creation"""
    payment_id: str
    user_id: str
    recipient: str
    amount: float
    frequency: str
    start_date: str
    end_date: Optional[str]
    next_payments: List[str]
    total_payments_scheduled: int
    estimated_total: float
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)


class SpendingAlertRequest(BaseModel):
    """Request to set spending alert"""
    user_id: str
    alert_type: str  # daily_limit, category_limit, unusual_activity, budget_warning
    threshold: float = Field(..., gt=0)
    categories: Optional[List[str]] = None


class SpendingAlertResponse(BaseModel):
    """Response from spending alert creation"""
    alert_id: str
    user_id: str
    alert_type: str
    threshold: float
    categories: Any
    current_spending: float
    buffer_remaining: float
    status: str
    notification_channels: List[str]
    timestamp: datetime = Field(default_factory=datetime.now)


class AutomatedSavingsRequest(BaseModel):
    """Request to create automated savings"""
    user_id: str
    savings_strategy: str  # round_up, percentage, fixed_amount, smart_save
    target_amount: float = Field(..., gt=0)
    timeline_months: int = Field(..., gt=0, le=120)


class AutomatedSavingsResponse(BaseModel):
    """Response from automated savings creation"""
    workflow_id: str
    user_id: str
    savings_strategy: str
    target_amount: float
    timeline_months: int
    monthly_savings: float
    plan_description: str
    achievability: str
    achievability_score: int
    milestones: List[Dict[str, Any]]
    estimated_completion: str
    status: str
    timestamp: datetime = Field(default_factory=datetime.now)


class WorkflowCreateRequest(BaseModel):
    """Request to create custom workflow"""
    user_id: str
    workflow_name: str
    workflow_type: str  # sequential, parallel, conditional, event_driven
    steps: List[Dict[str, Any]]
    triggers: List[str]


class WorkflowCreateResponse(BaseModel):
    """Response from workflow creation"""
    workflow_id: str
    user_id: str
    workflow_name: str
    workflow_type: str
    steps_count: int
    triggers: List[str]
    status: str
    created_at: str
    timestamp: datetime = Field(default_factory=datetime.now)


class WorkflowExecuteRequest(BaseModel):
    """Request to execute workflow"""
    workflow_id: str
    input_data: Optional[Dict[str, Any]] = None


class WorkflowExecuteResponse(BaseModel):
    """Response from workflow execution"""
    workflow_id: str
    workflow_name: str
    workflow_type: str
    execution_id: str
    steps_executed: int
    results: List[Dict[str, Any]]
    status: str
    completed_at: str
    timestamp: datetime = Field(default_factory=datetime.now)


class WorkflowMonitorResponse(BaseModel):
    """Response from workflow monitoring"""
    user_id: str
    active_workflows: List[Dict[str, Any]]
    total: int
    monitored_at: str
    timestamp: datetime = Field(default_factory=datetime.now)
